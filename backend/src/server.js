// Express application entry point.
// Sets up static file serving for the frontend, mounts the REST API routers,
// and installs 404 + global error handlers.
const express = require("express");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
// Make sure the uploads directory exists at startup.
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

// Parse JSON request bodies.
app.use(express.json());
// Serve the static frontend (HTML/CSS/JS).
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// Serve uploaded attachment files through an authenticated endpoint so that
// private ticket attachments are not world-readable just by guessing the URL.
// Agents (admin / technician) may view any attachment; regular users only
// those belonging to tickets they created.
app.get("/api/uploads/:filename", authenticate, async (req, res, next) => {
  try {
    // Guard against path traversal in the requested file name.
    const filename = path.basename(req.params.filename);
    const attachment = await findAttachmentByFilename(filename);
    if (!attachment) {
      return res.status(404).json({ error: "Not found" });
    }

    const isAgent = req.user.role === "admin" || req.user.role === "technician";
    // attachment.created_by is the ticket creator's user id (integer), so it
    // must be compared against req.user.id, not req.user.username.
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

// Mount API routers under /api.
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/users", userRoutes);

// Fallback 404 for any unknown route.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler: log the error and return a generic 500 response
// so the server never crashes on an unhandled exception.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
