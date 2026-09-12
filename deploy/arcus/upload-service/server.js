/**
 * Arcus upload microservice — same contract as nvccz/scripts/local-upload-mock-server.ts
 * POST /upload  (multipart field: images[], body: type)
 * GET  /uploads/{type}/{filename}
 * GET  /health
 */
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3050);
const ROOT = process.env.UPLOAD_ROOT || path.join(__dirname, "storage");

if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = String(req.body?.type || "temp").replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = path.join(ROOT, type);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".bin";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const app = express();
app.use("/uploads", express.static(ROOT));

app.post("/upload", upload.array("images", 20), (req, res) => {
  const files = req.files || [];
  const type = String(req.body?.type || "temp");
  const host = req.get("host") || `127.0.0.1:${PORT}`;
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const base = `${proto}://${host}/uploads`;
  res.json({
    success: true,
    files: files.map((f) => ({
      url: `${base}/${type}/${f.filename}`,
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    })),
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, root: ROOT }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[arcus-upload] listening on :${PORT}, root=${ROOT}`);
});
