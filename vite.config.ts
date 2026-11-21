import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ptastgrweqmxpnhttznb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cKnX0Crxl2RUQwrCRY2KTg_E0LhoZD0';
const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const devSyncStorage = new Map<string, { userId: string; payload: any; updatedAt: string }>();

function syncApiDevPlugin(): Plugin {
  return {
    name: 'sync-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/sync')) {
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'Authentication required: Missing or malformed Bearer authorization token.',
            }));
            return;
          }

          const token = authHeader.substring(7).trim();
          if (!token) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'Authentication required: Bearer token is empty.',
            }));
            return;
          }

          let userId: string;
          try {
            const { data, error } = await supabaseServer.auth.getUser(token);
            if (error || !data?.user?.id) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: 'Invalid, revoked, or expired authentication session token.',
              }));
              return;
            }
            userId = data.user.id;
          } catch (err: any) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'Authentication check failed.',
            }));
            return;
          }

          const parts = req.url.split('?')[0].split('/');
          const appletId = parts[3] || '2a25406d-a516-461a-aab7-208d3865f39c';
          const storageKey = `${userId}:${appletId}`;

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body);

                // Ownership check
                if (payload.user?.id && payload.user.id !== userId) {
                  res.statusCode = 403;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Forbidden: You cannot modify sync data owned by another user account.',
                  }));
                  return;
                }

                if (payload.user) {
                  payload.user.id = userId;
                }

                const updatedAt = new Date().toISOString();
                devSyncStorage.set(storageKey, { userId, payload, updatedAt });
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    appletId,
                    userId,
                    updatedAt,
                    message: `State synchronized successfully for applet ${appletId}`,
                  })
                );
              } catch (err: any) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err?.message || 'Invalid JSON' }));
              }
            });
            return;
          } else if (req.method === 'GET') {
            const record = devSyncStorage.get(storageKey);
            res.setHeader('Content-Type', 'application/json');
            if (record && record.userId === userId) {
              res.end(
                JSON.stringify({
                  success: true,
                  appletId,
                  userId: record.userId,
                  updatedAt: record.updatedAt,
                  payload: record.payload,
                })
              );
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, appletId, message: 'No active sync state found for user.' }));
            }
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
