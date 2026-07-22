const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Submit a new (pending) registration.
router.post("/register", authController.register);
// Log in and receive a JWT.
router.post("/login", authController.login);
// Get the profile of the logged-in user.
router.get("/me", authenticate, authController.me);

module.exports = router;
