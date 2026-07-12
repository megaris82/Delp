// Authentication middleware: verify JWTs and enforce role-based access.
const { verifyToken } = require("../utils/jwt");

// Middleware: ensure the request carries a valid Bearer token and attach the
// decoded user (id, username, role) to req.user.
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Middleware factory: restrict an endpoint to one or more roles.
// Usage: authorize("admin") or authorize("technician", "admin").
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
