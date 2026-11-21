// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "1mb" }));
var SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ptastgrweqmxpnhttznb.supabase.co";
var SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_cKnX0Crxl2RUQwrCRY2KTg_E0LhoZD0";
var supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      error: "Malformed JWT: Token must have exactly three dot-separated segments (header.payload.signature)."
    };
  }
  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(payloadBase64.length + (4 - payloadBase64.length % 4) % 4, "=");
    const jsonStr = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(jsonStr);
    return { valid: true, payload };
  } catch (err) {
    return {
      valid: false,
      error: `Invalid JWT payload encoding: ${err?.message || "Failed to decode base64 JSON payload"}`
    };
  }
}
var verifySupabaseJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Authentication required: Missing Authorization header."
    });
  }
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required: Authorization header must use Bearer scheme."
    });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required: Bearer token cannot be empty."
    });
  }
  const decodeResult = decodeJwtPayload(token);
  if (!decodeResult.valid || !decodeResult.payload) {
    return res.status(401).json({
      success: false,
      error: decodeResult.error || "Invalid JWT structure."
    });
  }
  const { exp, aud, sub } = decodeResult.payload;
  if (typeof exp === "number") {
    const nowEpoch = Math.floor(Date.now() / 1e3);
    if (exp < nowEpoch) {
      return res.status(401).json({
        success: false,
        error: "Authentication token has expired. Please refresh your session."
      });
    }
  }
  if (aud && aud !== "authenticated") {
    return res.status(401).json({
      success: false,
      error: `Invalid token audience: '${aud}'. Expected 'authenticated'.`
    });
  }
  if (!sub || typeof sub !== "string") {
    return res.status(401).json({
      success: false,
      error: "Invalid token subject (sub claim missing)."
    });
  }
  try {
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data?.user || !data.user.id) {
      return res.status(401).json({
        success: false,
        error: error?.message || "Invalid, revoked, or unverified Supabase authentication session."
      });
    }
    if (data.user.id !== sub) {
      return res.status(401).json({
        success: false,
        error: "Token identity mismatch between claims and user record."
      });
    }
    req.user = data.user;
    req.verifiedUserId = data.user.id;
    req.userEmail = data.user.email;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Authentication verification failed: ${err?.message || "Internal auth check error"}`
    });
  }
};
var requireSupabaseAuth = verifySupabaseJwt;
var MAX_STORED_APPLETS = 50;
var appletSyncStorage = /* @__PURE__ */ new Map();
var SYNC_CACHE_DIR = path.join(__dirname, ".sync_cache");
if (!fs.existsSync(SYNC_CACHE_DIR)) {
  try {
    fs.mkdirSync(SYNC_CACHE_DIR, { recursive: true });
  } catch {
  }
}
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW_MS = 60 * 1e3;
var RATE_LIMIT_MAX_REQUESTS = 60;
var apiRateLimiter = (req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded. Please wait a minute before making further sync requests."
    });
  }
  record.count += 1;
  next();
};
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1e3);
app.get(["/api/health", "/health", "/healthz"], (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});
var LINKED_APPLET_ID = "2a25406d-a516-461a-aab7-208d3865f39c";
var CURRENT_APPLET_ID = "09e7b717-572b-4bf8-8976-8061669dffa7";
var ALLOWED_APPLET_IDS = /* @__PURE__ */ new Set([LINKED_APPLET_ID, CURRENT_APPLET_ID]);
function validateSyncPayload(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Payload must be an object" };
  }
  if (body.appletId && typeof body.appletId !== "string") {
    return { valid: false, error: "Invalid appletId" };
  }
  if (body.syllabus) {
    if (typeof body.syllabus !== "object") {
      return { valid: false, error: "Invalid syllabus structure" };
    }
    if (body.syllabus.subjects && !Array.isArray(body.syllabus.subjects)) {
      return { valid: false, error: "syllabus.subjects must be an array" };
    }
    if (Array.isArray(body.syllabus.subjects) && body.syllabus.subjects.length > 25) {
      return { valid: false, error: "syllabus.subjects exceeds maximum allowed count" };
    }
  }
  if (body.studyData) {
    if (typeof body.studyData !== "object") {
      return { valid: false, error: "Invalid studyData structure" };
    }
    if (body.studyData.tasks && !Array.isArray(body.studyData.tasks)) {
      return { valid: false, error: "studyData.tasks must be an array" };
    }
    if (Array.isArray(body.studyData.tasks) && body.studyData.tasks.length > 500) {
      return { valid: false, error: "studyData.tasks exceeds maximum allowed count (500)" };
    }
    if (body.studyData.totalHoursStudied !== void 0 && (typeof body.studyData.totalHoursStudied !== "number" || isNaN(body.studyData.totalHoursStudied) || body.studyData.totalHoursStudied < 0)) {
      return { valid: false, error: "totalHoursStudied must be a non-negative number" };
    }
  }
  return { valid: true };
}
app.post(
  ["/api/sync/linked", `/api/sync/${LINKED_APPLET_ID}`, "/api/sync/:appletId"],
  apiRateLimiter,
  verifySupabaseJwt,
  (req, res) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    const userId = req.verifiedUserId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user session." });
    }
    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized applet identifier. Access restricted to authorized applets."
      });
    }
    const payload = req.body;
    const validation = validateSyncPayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error || "Invalid payload structure" });
    }
    if (payload.user?.id && payload.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You cannot modify sync data owned by another user account."
      });
    }
    payload.user = {
      ...payload.user || {},
      id: userId,
      email: req.userEmail || payload.user?.email || ""
    };
    const storageKey = `${userId}:${targetId}`;
    if (appletSyncStorage.size >= MAX_STORED_APPLETS && !appletSyncStorage.has(storageKey)) {
      const oldestKey = appletSyncStorage.keys().next().value;
      if (oldestKey) appletSyncStorage.delete(oldestKey);
    }
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    appletSyncStorage.set(storageKey, { userId, appletId: targetId, payload, updatedAt });
    try {
      const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, "");
      const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
      fs.writeFileSync(cachePath, JSON.stringify({ userId, appletId: targetId, payload, updatedAt }), "utf8");
    } catch (err) {
      console.warn("Sync cache write notice:", err);
    }
    res.status(200).json({
      success: true,
      appletId: targetId,
      userId,
      updatedAt,
      message: `State synchronized successfully for applet ${targetId}`
    });
  }
);
app.get(
  ["/api/sync/linked", `/api/sync/${LINKED_APPLET_ID}`, "/api/sync/:appletId"],
  apiRateLimiter,
  verifySupabaseJwt,
  (req, res) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    const userId = req.verifiedUserId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user session." });
    }
    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized applet identifier. Access restricted to authorized applets."
      });
    }
    const requestedUserId = req.query.userId;
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You cannot access sync data belonging to another user account."
      });
    }
    const storageKey = `${userId}:${targetId}`;
    let record = appletSyncStorage.get(storageKey);
    if (!record) {
      try {
        const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, "");
        const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
        if (fs.existsSync(cachePath)) {
          const raw = fs.readFileSync(cachePath, "utf8");
          const parsed = JSON.parse(raw);
          if (parsed && parsed.userId === userId) {
            record = parsed;
            appletSyncStorage.set(storageKey, parsed);
          }
        }
      } catch (err) {
        console.warn("Sync cache read notice:", err);
      }
    }
    if (record && record.userId === userId) {
      res.status(200).json({
        success: true,
        appletId: targetId,
        userId,
        updatedAt: record.updatedAt,
        payload: record.payload
      });
    } else {
      res.status(404).json({
        success: false,
        appletId: targetId,
        message: `No active sync state found for user on applet ${targetId}`
      });
    }
  }
);
app.delete(
  ["/api/sync/linked", `/api/sync/${LINKED_APPLET_ID}`, "/api/sync/:appletId"],
  apiRateLimiter,
  verifySupabaseJwt,
  (req, res) => {
    const rawId = req.params.appletId || LINKED_APPLET_ID;
    const targetId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    const userId = req.verifiedUserId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user session." });
    }
    if (!targetId || !ALLOWED_APPLET_IDS.has(targetId)) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized applet identifier. Access restricted to authorized applets."
      });
    }
    const storageKey = `${userId}:${targetId}`;
    appletSyncStorage.delete(storageKey);
    try {
      const safeUserFilename = userId.replace(/[^a-zA-Z0-9_-]/g, "");
      const cachePath = path.join(SYNC_CACHE_DIR, `${safeUserFilename}_${targetId}.json`);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    } catch (err) {
      console.warn("Sync cache delete notice:", err);
    }
    res.status(200).json({
      success: true,
      appletId: targetId,
      userId,
      message: `Sync state purged successfully for user on applet ${targetId}`
    });
  }
);
app.post(
  "/api/notes/validate",
  apiRateLimiter,
  verifySupabaseJwt,
  (req, res) => {
    const { entityType, entityId, noteType, title, htmlContent } = req.body || {};
    if (!["subject", "topic", "subtopic"].includes(entityType)) {
      return res.status(400).json({ success: false, error: "entityType must be subject, topic, or subtopic." });
    }
    if (!["complete", "short"].includes(noteType)) {
      return res.status(400).json({ success: false, error: "noteType must be complete or short." });
    }
    if (!entityId || typeof entityId !== "string") {
      return res.status(400).json({ success: false, error: "Valid entityId is required." });
    }
    if (!htmlContent || typeof htmlContent !== "string" || !htmlContent.trim()) {
      return res.status(400).json({ success: false, error: "HTML content cannot be empty." });
    }
    if (Buffer.byteLength(htmlContent, "utf8") > 2 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: "HTML note exceeds 2 MB maximum size." });
    }
    return res.status(200).json({
      success: true,
      validatedBy: req.verifiedUserId,
      title: typeof title === "string" && title.trim() ? title.trim() : `${noteType} notes`,
      byteLength: Buffer.byteLength(htmlContent, "utf8")
    });
  }
);
app.post(
  "/api/tests/validate-questions",
  apiRateLimiter,
  verifySupabaseJwt,
  (req, res) => {
    const questions = req.body?.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: "questions array must be non-empty." });
    }
    if (questions.length > 500) {
      return res.status(400).json({ success: false, error: "Maximum 500 questions per import batch." });
    }
    const invalidIndices = [];
    questions.forEach((q, idx) => {
      const validAns = ["A", "B", "C", "D"].includes(String(q?.correctAnswer || "").toUpperCase());
      if (!q?.questionText || !q?.optionA || !q?.optionB || !q?.optionC || !q?.optionD || !validAns) {
        invalidIndices.push(idx + 1);
      }
    });
    if (invalidIndices.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Validation failed on question rows: ${invalidIndices.join(", ")}`,
        invalidIndices
      });
    }
    return res.status(200).json({
      success: true,
      validatedCount: questions.length,
      validatedBy: req.verifiedUserId
    });
  }
);
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("Application build in progress.");
  }
});
var server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
});
var shutdown = () => {
  console.log("Received kill signal, shutting down gracefully...");
  server.close(() => {
    console.log("Closed out remaining connections");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 1e4);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
export {
  decodeJwtPayload,
  requireSupabaseAuth,
  supabaseServer,
  verifySupabaseJwt
};
