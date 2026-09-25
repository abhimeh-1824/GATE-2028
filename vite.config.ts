import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const devSyncStorage = new Map<string, { payload: any; updatedAt: string }>();

function syncApiDevPlugin(): Plugin {
  return {
    name: 'sync-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/sync')) {
          const parts = req.url.split('?')[0].split('/');
          const appletId = parts[3] || '2a25406d-a516-461a-aab7-208d3865f39c';

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body);
                const updatedAt = new Date().toISOString();
                devSyncStorage.set(appletId, { payload, updatedAt });
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    appletId,
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
            const record = devSyncStorage.get(appletId);
            res.setHeader('Content-Type', 'application/json');
            if (record) {
              res.end(JSON.stringify({ success: true, appletId, ...record }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, appletId, message: 'No sync record yet' }));
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
