const { findAll, findById, update, remove } = require("../models/userModel");

const ROLES = ["user", "technician", "admin"];
const STATUSES = ["pending", "denied", "accepted"];

async function list(req, res, next) {
  try {
    const filters = {};
    if (req.query.role) {
      if (!ROLES.includes(req.query.role)) {
        return res.status(400).json({ error: "Invalid role filter" });
      }
      filters.role = req.query.role;
    }
    if (req.query.register_status) {
      if (!STATUSES.includes(req.query.register_status)) {
        return res.status(400).json({ error: "Invalid register_status filter" });
      }
      filters.register_status = req.query.register_status;
    }
    const users = await findAll(filters);
    return res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const existing = await findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const errors = [];
    const role = req.body.role || existing.role;
    const register_status = req.body.register_status || existing.register_status;

    if (!ROLES.includes(role)) {
      errors.push("role must be one of user, technician, admin");
    }
    if (!STATUSES.includes(register_status)) {
      errors.push("register_status must be one of pending, denied, accepted");
    }

    const firstName = req.body.firstName !== undefined ? req.body.firstName : existing.firstName;
    const lastName = req.body.lastName !== undefined ? req.body.lastName : existing.lastName;
    const address = req.body.address !== undefined ? req.body.address : existing.address;
    const country = req.body.country !== undefined ? req.body.country : existing.country;
    const city = req.body.city !== undefined ? req.body.city : existing.city;
    const email = req.body.email !== undefined ? req.body.email : existing.email;

    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.push("email must be a valid address");
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const user = await update(req.params.id, {
      firstName,
      lastName,
      email,
      country,
      city,
      address,
      role,
      register_status,
    });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    const ok = await remove(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, updateUser, deleteUser };
