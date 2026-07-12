const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, announcementController.list);
router.post("/", authenticate, authorize("admin"), announcementController.createAnnouncement);
router.put("/:id", authenticate, authorize("admin"), announcementController.updateAnnouncement);
router.delete("/:id", authenticate, authorize("admin"), announcementController.deleteAnnouncement);

module.exports = router;
