// Authentication controller: registration, login and a "who am I" endpoint.
const { findByUsername, findById, create, verifyPassword } = require("../models/userModel");
const { signToken, JWT_EXPIRES_IN } = require("../utils/jwt");
const { validateRegister, validateLogin } = require("../utils/validation");

// POST /api/auth/register
// Accepts a self-registration request. The new user is stored with
// register_status = "pending" and role "user"; an admin must approve it later.
async function register(req, res, next) {
  try {
    const { errors, value } = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const existing = await findByUsername(value.username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const user = await create(value);

    return res.status(201).json({
      message: "Registration submitted. An admin will review and assign a role.",
      user: {
        id: user.id,
        username: user.username,
        register_status: user.register_status,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
// Verifies credentials, checks the account is approved, and returns a JWT.
async function login(req, res, next) {
  try {
    const { errors, value } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const user = await findByUsername(value.username);
    if (!user || !(await verifyPassword(value.password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Block login until an admin approves the registration request.
    if (user.register_status !== "accepted") {
      return res
        .status(403)
        .json({ error: `Registration ${user.register_status}` });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Never send the password hash back to the client.
    const { password, ...safeUser } = user;
    return res.json({ message: "Signed in", token, expiresIn: JWT_EXPIRES_IN, user: safeUser });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Returns the profile of the currently authenticated user (from the JWT).
async function me(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
