import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient, type User } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Nginx listens on Cloud Run's external port (8080) and proxies to http://localhost:3000.
// Therefore, this Express app must always listen on port 3000.
const PORT = 3000;

// Body limit reduced to 1mb to mitigate DoS vectors
app.use(express.json({ limit: '1mb' }));

export interface AuthenticatedRequest extends Request {
  user?: User;
  verifiedUserId?: string;
  userEmail?: string;
}

// Supabase client instance initialized with environment variables or canonical project fallback
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ptastgrweqmxpnhttznb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cKnX0Crxl2RUQwrCRY2KTg_E0LhoZD0';

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Safely parses and decodes the JWT payload to pre-validate structure and standard claims (exp, aud, sub).
 */
export function decodeJwtPayload(token: string): { valid: boolean; payload?: any; error?: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: 'Malformed JWT: Token must have exactly three dot-separated segments (header.payload.signature).',
    };
  }

  try {
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64.padEnd(payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4), '=');
    const jsonStr = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(jsonStr);
    return { valid: true, payload };
  } catch (err: any) {
    return {
      valid: false,
      error: `Invalid JWT payload encoding: ${err?.message || 'Failed to decode base64 JSON payload'}`,
    };
  }
}

/**
 * Express middleware that verifies incoming Supabase JWT Bearer tokens for API routes.
 */
export const verifySupabaseJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required: Missing Authorization header.',
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required: Authorization header must use Bearer scheme.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required: Bearer token cannot be empty.',
    });
  }

  // 1. Inspect and pre-verify JWT payload
  const decodeResult = decodeJwtPayload(token);
  if (!decodeResult.valid || !decodeResult.payload) {
    return res.status(401).json({
      success: false,
      error: decodeResult.error || 'Invalid JWT structure.',
    });
  }

  const { exp, aud, sub } = decodeResult.payload;

  // Check expiration timestamp
  if (typeof exp === 'number') {
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (exp < nowEpoch) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please refresh your session.',
      });
    }
  }

  // Validate audience
  if (aud && aud !== 'authenticated') {
    return res.status(401).json({
      success: false,
      error: `Invalid token audience: '${aud}'. Expected 'authenticated'.`,
    });
  }

  // Validate subject claim
  if (!sub || typeof sub !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token subject (sub claim missing).',
    });
  }

  // 2. Cryptographic signature and revocation validation via Supabase Auth service
  try {
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data?.user || !data.user.id) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Invalid, revoked, or unverified Supabase authentication session.',
      });
    }

    // Verify sub claim matches authenticated user ID
    if (data.user.id !== sub) {
      return res.status(401).json({
        success: false,
        error: 'Token identity mismatch between claims and user record.',
      });
    }

    // Attach verified user identity to the Express request
    req.user = data.user;
    req.verifiedUserId = data.user.id;
    req.userEmail = data.user.email;

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: `Authentication verification failed: ${err?.message || 'Internal auth check error'}`,
    });
  }
};

// Alias requireSupabaseAuth for backward compatibility
export const requireSupabaseAuth = verifySupabaseJwt;

// Cross-Applet Sync Storage (in-memory + local file cache with bounded limits, scoped by userId:appletId)
const MAX_STORED_APPLETS = 50;
const appletSyncStorage = new Map<string, { userId: string; appletId: string; payload: any; updatedAt: string }>();
const SYNC_CACHE_DIR = path.join(__dirname, '.sync_cache');
if (!fs.existsSync(SYNC_CACHE_DIR)) {
  try {
    fs.mkdirSync(SYNC_CACHE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// In-Memory Rate Limiter for API endpoints (max 60 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a minute before making further sync requests.',
    });
  }

  record.count += 1;
  next();
};

// Periodic cleanup of rate limiter map
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Standard healthcheck endpoints for Cloud Run / GCP probes
app.get(['/api/health', '/health', '/healthz'], (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Applet Sync API routes with strict authorization & payload schema validation
const LINKED_APPLET_ID = '2a25406d-a516-461a-aab7-208d3865f39c';
const CURRENT_APPLET_ID = '09e7b717-572b-4bf8-8976-8061669dffa7';
const ALLOWED_APPLET_IDS = new Set([LINKED_APPLET_ID, CURRENT_APPLET_ID]);

// Payload schema validator
function validateSyncPayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }

  if (body.appletId && typeof body.appletId !== 'string') {
    return { valid: false, error: 'Invalid appletId' };
  }

  if (body.syllabus) {
    if (typeof body.syllabus !== 'object') {
      return { valid: false, error: 'Invalid syllabus structure' };
    }
    if (body.syllabus.subjects && !Array.isArray(body.syllabus.subjects)) {
      return { valid: false, error: 'syllabus.subjects must be an array' };
    }
    if (Array.isArray(body.syllabus.subjects) && body.syllabus.subjects.length > 25) {
      return { valid: false, error: 'syllabus.subjects exceeds maximum allowed count' };
    }
  }

  if (body.studyData) {
    if (typeof body.studyData !== 'object') {
      return { valid: false, error: 'Invalid studyData structure' };
    }
    if (body.studyData.tasks && !Array.isArray(body.studyData.tasks)) {
      return { valid: false, error: 'studyData.tasks must be an array' };
    }
    if (Array.isArray(body.studyData.tasks) && body.studyData.tasks.length > 500) {
      return { valid: false, error: 'studyData.tasks exceeds maximum allowed count (500)' };
    }
    if (
      body.studyData.totalHoursStudied !== undefined &&
      (typeof body.studyData.totalHoursStudied !== 'number' || isNaN(body.studyData.totalHoursStudied) || body.studyData.totalHoursStudied < 0)
    ) {
      return { valid: false, error: 'totalHoursStudied must be a non-negative number' };
    }
  }

  return { valid: true };
}

app.post(
  ['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'],
  apiRateLimiter,
  verifySupabaseJwt,
  (req: AuthenticatedRequest, res: Response) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const userId = req.verifiedUserId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user session.' });
    }

    // Authorize only allowed applet IDs
    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized applet identifier. Access restricted to authorized applets.',
      });
    }

    const payload = req.body;
    const validation = validateSyncPayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error || 'Invalid payload structure' });
    }

    // Explicit data ownership check: Reject if client attempts to write data under someone else's identity
    if (payload.user?.id && payload.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot modify sync data owned by another user account.',
      });
    }

    // Strict ownership: override/bind payload user identity to the verified token user ID
    payload.user = {
      ...(payload.user || {}),
      id: userId,
      email: req.userEmail || payload.user?.email || '',
    };

    const storageKey = `${userId}:${targetId}`;

    // Bound memory storage
    if (appletSyncStorage.size >= MAX_STORED_APPLETS && !appletSyncStorage.has(storageKey)) {
      const oldestKey = appletSyncStorage.keys().next().value;
      if (oldestKey) appletSyncStorage.delete(oldestKey);
    }

    const updatedAt = new Date().toISOString();
    appletSyncStorage.set(storageKey, { userId, appletId: targetId, payload, updatedAt });

    try {
      const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
      fs.writeFileSync(cachePath, JSON.stringify({ userId, appletId: targetId, payload, updatedAt }), 'utf8');
    } catch (err) {
      console.warn('Sync cache write notice:', err);
    }

    res.status(200).json({
      success: true,
      appletId: targetId,
      userId,
      updatedAt,
      message: `State synchronized successfully for applet ${targetId}`,
    });
  }
);

app.get(
  ['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'],
  apiRateLimiter,
  verifySupabaseJwt,
  (req: AuthenticatedRequest, res: Response) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const userId = req.verifiedUserId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user session.' });
    }

    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized applet identifier. Access restricted to authorized applets.',
      });
    }

    // Explicit data ownership check: Reject if client attempts to query another user's data
    const requestedUserId = req.query.userId as string | undefined;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot access sync data belonging to another user account.',
      });
    }

    const storageKey = `${userId}:${targetId}`;
    let record = appletSyncStorage.get(storageKey);

    if (!record) {
      try {
        const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, '');
        const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
        if (fs.existsSync(cachePath)) {
          const raw = fs.readFileSync(cachePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.userId === userId) {
            record = parsed;
            appletSyncStorage.set(storageKey, parsed);
          }
        }
      } catch (err) {
        console.warn('Sync cache read notice:', err);
      }
    }

    if (record && record.userId === userId) {
      res.status(200).json({
        success: true,
        appletId: targetId,
        userId,
        updatedAt: record.updatedAt,
        payload: record.payload,
      });
    } else {
      res.status(404).json({
        success: false,
        appletId: targetId,
        message: `No active sync state found for user on applet ${targetId}`,
      });
    }
  }
);

app.delete(
  ['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'],
  apiRateLimiter,
  verifySupabaseJwt,
  (req: AuthenticatedRequest, res: Response) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const userId = req.verifiedUserId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user session.' });
    }

    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized applet identifier. Access restricted to authorized applets.',
      });
    }

    const storageKey = `${userId}:${targetId}`;
    appletSyncStorage.delete(storageKey);

    try {
      const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    } catch (err) {
      console.warn('Sync cache delete notice:', err);
    }

    res.status(200).json({
      success: true,
      appletId: targetId,
      userId,
      message: `Sync state purged successfully for user on applet ${targetId}`,
    });
  }
);

// Serve static assets from dist
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Application build in progress.');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
});

// Graceful termination handling for Cloud Run container lifecycle
const shutdown = () => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
