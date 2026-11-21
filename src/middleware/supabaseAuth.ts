import type { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';

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
 *
 * Enforces:
 * 1. Presence and structure of Authorization: Bearer <JWT>
 * 2. Unexpired claim check (exp > now)
 * 3. Valid audience (aud: 'authenticated')
 * 4. Cryptographic validation and active session verification via Supabase Auth service
 * 5. Attaches verified user to request: req.user, req.verifiedUserId, req.userEmail
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
