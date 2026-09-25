import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Nginx listens on Cloud Run's external port (8080) and proxies to http://localhost:3000.
// Therefore, this Express app must always listen on port 3000.
const PORT = 3000;

// Body limit reduced from 15mb to 1mb to mitigate DoS vectors
app.use(express.json({ limit: '1mb' }));

// Cross-Applet Sync Storage (in-memory + local file cache with bounded limits)
const MAX_STORED_APPLETS = 10;
const appletSyncStorage = new Map<string, { payload: any; updatedAt: string }>();
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

app.post(['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'], apiRateLimiter, (req, res) => {
  const rawId = req.params.appletId || LINKED_APPLET_ID;
  const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

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

  // Bound memory storage
  if (appletSyncStorage.size >= MAX_STORED_APPLETS && !appletSyncStorage.has(targetId)) {
    const oldestKey = appletSyncStorage.keys().next().value;
    if (oldestKey) appletSyncStorage.delete(oldestKey);
  }

  const updatedAt = new Date().toISOString();
  appletSyncStorage.set(targetId, { payload, updatedAt });

  try {
    const cachePath = path.join(SYNC_CACHE_DIR, `${targetId}.json`);
    fs.writeFileSync(cachePath, JSON.stringify({ payload, updatedAt }), 'utf8');
  } catch (err) {
    console.warn('Sync cache write notice:', err);
  }

  res.status(200).json({
    success: true,
    appletId: targetId,
    updatedAt,
    message: `State synchronized successfully for applet ${targetId}`,
  });
});

app.get(['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'], apiRateLimiter, (req, res) => {
  const rawId = req.params.appletId || LINKED_APPLET_ID;
  const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

  if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized applet identifier. Access restricted to authorized applets.',
    });
  }

  let record = appletSyncStorage.get(targetId);

  if (!record) {
    try {
      const cachePath = path.join(SYNC_CACHE_DIR, `${targetId}.json`);
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        record = JSON.parse(raw);
        if (record) {
          appletSyncStorage.set(targetId, record);
        }
      }
    } catch (err) {
      console.warn('Sync cache read notice:', err);
    }
  }

  if (record) {
    res.status(200).json({
      success: true,
      appletId: targetId,
      updatedAt: record.updatedAt,
      payload: record.payload,
    });
  } else {
    res.status(404).json({
      success: false,
      appletId: targetId,
      message: `No active sync state found for applet ${targetId}`,
    });
  }
});

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
