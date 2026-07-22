const { findByUsername, findById, create, verifyPassword } = require("../models/userModel");
const { signToken } = require("../utils/jwt");
const { validateRegister, validateLogin } = require("../utils/validation");

// POST /api/auth/register — saves a new account with status "pending" and
// role "user". An admin has to approve it before the user can log in.
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

// POST /api/auth/login — checks username/password, makes sure the account has
// been accepted, and returns a JWT.
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

    // A pending or denied registration can't log in yet.
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

    // Strip the password hash before sending the user back.
    const { password, ...safeUser } = user;
    return res.json({ message: "Signed in", token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — returns the profile of the logged-in user (from the JWT).
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
