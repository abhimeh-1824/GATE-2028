import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Nginx listens on Cloud Run's external port (8080) and proxies to http://localhost:3000.
// Therefore, this Express app must always listen on port 3000.
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Cross-Applet Sync Storage (in-memory + local file cache)
const appletSyncStorage = new Map<string, { payload: any; updatedAt: string }>();
const SYNC_CACHE_DIR = path.join(__dirname, '.sync_cache');
if (!fs.existsSync(SYNC_CACHE_DIR)) {
  try {
    fs.mkdirSync(SYNC_CACHE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// Standard healthcheck endpoints for Cloud Run / GCP probes
app.get(['/api/health', '/health', '/healthz'], (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Applet Sync API routes with sanitization & payload schema validation
const LINKED_APPLET_ID = '2a25406d-a516-461a-aab7-208d3865f39c';

app.post(['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'], (req, res) => {
  const rawId = req.params.appletId || LINKED_APPLET_ID;
  const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!targetId) {
    return res.status(400).json({ success: false, error: 'Invalid applet ID' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid payload structure' });
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

app.get(['/api/sync/linked', `/api/sync/${LINKED_APPLET_ID}`, '/api/sync/:appletId'], (req, res) => {
  const rawId = req.params.appletId || LINKED_APPLET_ID;
  const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!targetId) {
    return res.status(400).json({ success: false, error: 'Invalid applet ID' });
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
