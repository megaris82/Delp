require("dotenv").config();
const jwt = require("jsonwebtoken");

// Secret used to sign/verify tokens. Comes from .env.
const JWT_SECRET = process.env.JWT_KEY;
// How long a login token stays valid.
const JWT_EXPIRES_IN = "12h";

// Builds a signed JWT for the given user payload (id, username, role).
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Checks that a token is valid and returns its payload. Throws if it's
// expired or tampered with.
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
