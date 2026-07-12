// User routes: listing and admin user management.
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

// GET  /api/users          -> list users (admin, technician); supports ?role & ?register_status filters
router.get("/", authenticate, authorize("admin", "technician"), userController.list);
// PUT  /api/users/:id      -> update a user / approve registration / assign role (admin)
router.put("/:id", authenticate, authorize("admin"), userController.updateUser);
// DELETE /api/users/:id    -> delete a user (admin)
router.delete("/:id", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
