// File upload handling using multer (multipart/form-data).
// Used for ticket attachments (e.g. screenshots).
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// Directory where uploaded files are stored (backend/uploads).
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

// Only image files are accepted.
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Allowed file extensions (kept in sync with ALLOWED MIME types). Both the
// MIME type and the extension are validated to block "image/jpeg" claims that
// carry a non-image extension such as .php.
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Maximum upload size: 5 MB.
const MAX_SIZE = 5 * 1024 * 1024;

// Configure disk storage: keep the original extension but generate a random
// file name to avoid collisions and path-traversal issues.
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

// Reject any file whose MIME type or extension is not in the allowed lists.
const fileFilter = function (req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Μόνο αρχεία εικόνας επιτρέπονται (jpeg, png, gif, webp)."));
  }
};

// Export a configured multer middleware that handles a single file under the
// field name "attachment".
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: fileFilter,
}).single("attachment");

module.exports = { upload, UPLOAD_DIR };
