const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

// List users (agents). Supports ?role and ?register_status filters.
router.get("/", authenticate, authorize("admin", "technician"), userController.list);
// Update a user / approve a registration / assign a role (admin).
router.put("/:id", authenticate, authorize("admin"), userController.updateUser);
// Delete a user (admin).
router.delete("/:id", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
