// Load environment variables (the JWT secret lives in .env).
require("dotenv").config();

// jsonwebtoken library used to sign and verify JWT access tokens.
const jwt = require("jsonwebtoken");

// Secret key used to sign tokens. Must match the value in the .env file.
const JWT_SECRET = process.env.JWT_KEY;

// Access tokens are valid for 12 hours.
const JWT_EXPIRES_IN = "12h";

// Create (sign) a new JWT for the given payload (usually { id, username, role }).
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify a JWT and return its decoded payload. Throws if the token is invalid or expired.
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
