const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}-${safe}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return cb(new Error('Only JPG, PNG, WEBP, GIF or PDF files can be uploaded'));
  }
  return cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Turns a multer file into the shape stored on documents
const toFileMeta = (file) => ({
  url: `/uploads/${file.filename}`,
  name: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
});

module.exports = { upload, toFileMeta };
