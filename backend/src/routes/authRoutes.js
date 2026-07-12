// Auth routes: registration, login and "current user" endpoints.
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/register  -> submit a new (pending) registration
router.post("/register", authController.register);
// POST /api/auth/login     -> authenticate and receive a JWT
router.post("/login", authController.login);
// GET  /api/auth/me        -> get the profile of the authenticated user
router.get("/me", authenticate, authController.me);

module.exports = router;
