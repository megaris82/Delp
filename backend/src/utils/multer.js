const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// Where uploaded files end up on disk.
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

// Only images are allowed. We check both the MIME type and the extension so
// that a file claiming "image/jpeg" but named "evil.php" gets rejected.
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// 5 MB max per file.
const MAX_SIZE = 5 * 1024 * 1024;

// Save files to UPLOAD_DIR with a random hex name so original names (and any
// weird characters in them) can't collide or be guessed.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

// Reject anything that isn't in the allowed lists above.
const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Μόνο αρχεία εικόνας επιτρέπονται (jpeg, png, gif, webp)."));
  }
};

// One file per request, under the form field name "attachment".
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: fileFilter,
}).single("attachment");

module.exports = { upload, UPLOAD_DIR };
