const { verifyToken } = require("../utils/jwt");

// Reads the "Authorization: Bearer <token>" header, checks the token, and
// puts the decoded user (id, username, role) on req.user for later handlers.
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

// Returns a middleware that only lets the given roles through.
// Example: authorize("admin") or authorize("technician", "admin").
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
