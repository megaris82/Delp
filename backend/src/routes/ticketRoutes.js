const express = require("express");
const multer = require("multer");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const commentController = require("../controllers/commentController");
const { authenticate, authorize } = require("../middleware/auth");
const { upload } = require("../utils/multer");

// Wraps multer so upload errors come back as JSON instead of Express's
// default HTML error page.
function handleUpload(req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "Το αρχείο υπερβαίνει το μέγιστο μέγεθος (5MB)."
            : "Σφάλμα μεταφόρτωσης αρχείου.";
        return res.status(400).json({ error: message });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// List tickets (agents see all, users see their own).
router.get("/", authenticate, ticketController.list);
// Create a ticket with an optional attachment.
router.post("/", authenticate, authorize("user"), handleUpload, ticketController.createTicket);

// List comments on a ticket.
router.get("/:id/comments", authenticate, commentController.list);
// Add a comment to a ticket (agents only).
router.post(
  "/:id/comments",
  authenticate,
  authorize("technician", "admin"),
  commentController.addComment
);

// Update a ticket's status / assignee / resolution (agents only).
router.patch("/:id", authenticate, authorize("technician", "admin"), ticketController.updateTicket);

module.exports = router;
