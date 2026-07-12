// Ticket routes: CRUD + comments. File uploads are handled by multer.
const express = require("express");
const multer = require("multer");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const commentController = require("../controllers/commentController");
const { authenticate, authorize } = require("../middleware/auth");
const { upload } = require("../utils/multer");

// Wrap multer so upload errors are returned as JSON instead of HTML.
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

// GET    /api/tickets            -> list tickets (agent: all, user: own)
router.get("/", authenticate, ticketController.list);
// POST   /api/tickets            -> create a ticket with optional attachment (user)
router.post("/", authenticate, authorize("user"), handleUpload, ticketController.createTicket);

// GET    /api/tickets/:id/comments -> list comments for a ticket
router.get("/:id/comments", authenticate, commentController.list);
// POST   /api/tickets/:id/comments -> add a comment (admin, technician)
router.post(
  "/:id/comments",
  authenticate,
  authorize("technician", "admin"),
  commentController.addComment
);

// PATCH  /api/tickets/:id        -> update status / assignee / resolution (admin, technician)
router.patch("/:id", authenticate, authorize("technician", "admin"), ticketController.updateTicket);

module.exports = router;
