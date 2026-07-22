const express = require("express");
const path = require("path");
const fs = require("fs");

// Folder where uploaded attachments are stored on disk.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
// Create it at startup so multer doesn't fail on the first upload.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userRoutes = require("./routes/userRoutes");
const { authenticate } = require("./middleware/auth");
const { findAttachmentByFilename } = require("./models/ticketModel");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve the static frontend files (HTML/CSS/JS) from the /frontend folder.
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// Serve attachment files behind login so that a user can't just guess a URL.
// Agents can view any attachment; regular users only their own tickets' files.
app.get("/api/uploads/:filename", authenticate, async (req, res, next) => {
  try {
    // path.basename drops any "../" etc. so nobody can read files outside UPLOAD_DIR.
    const filename = path.basename(req.params.filename);
    const attachment = await findAttachmentByFilename(filename);
    if (!attachment) {
      return res.status(404).json({ error: "Not found" });
    }

    const isAgent = req.user.role === "admin" || req.user.role === "technician";
    // attachment.created_by is the ticket creator's user id, so compare with req.user.id.
    if (!isAgent && attachment.created_by !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// All API routers live under /api.
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/users", userRoutes);

// Anything that didn't match a route above is a 404.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Last-resort error handler: log the real error but return a generic message
// so the client never sees an internal stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
