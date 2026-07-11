require("dotenv").config();

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_KEY;
const JWT_EXPIRES_IN = "12h";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
