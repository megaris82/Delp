// Announcement routes: listing (all) and admin management.
const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { authenticate, authorize } = require("../middleware/auth");

// GET    /api/announcements       -> list announcements
router.get("/", authenticate, announcementController.list);
// POST   /api/announcements       -> create an announcement (admin)
router.post("/", authenticate, authorize("admin"), announcementController.createAnnouncement);
// PUT    /api/announcements/:id   -> update an announcement (admin)
router.put("/:id", authenticate, authorize("admin"), announcementController.updateAnnouncement);
// DELETE /api/announcements/:id   -> delete an announcement (admin)
router.delete("/:id", authenticate, authorize("admin"), announcementController.deleteAnnouncement);

module.exports = router;
