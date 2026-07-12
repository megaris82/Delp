// Data access layer for the "users" table.
const { pool } = require("../db");
const bcrypt = require("bcryptjs");

// Find a single user by username (used during login and to detect duplicates).
async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0] || null;
}

// Find a single user by id, returning only non-sensitive columns (no password hash).
async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, username, firstName, lastName, email, country, city, address, role, register_status, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

// Create a new user. The password is hashed with bcrypt before being stored.
async function create(user) {
  const hashed = await bcrypt.hash(user.password, 10);
  const [result] = await pool.query(
    `INSERT INTO users
       (username, password, firstName, lastName, email, country, city, address, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.username,
      hashed,
      user.firstName,
      user.lastName,
      user.email,
      user.country,
      user.city,
      user.address,
      user.role,
    ]
  );
  return findById(result.insertId);
}

// Compare a plaintext password with a bcrypt hash.
async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// List users, optionally filtered by role and/or registration status.
async function findAll(filters = {}) {
  const where = [];
  const params = [];
  if (filters.role) {
    where.push("role = ?");
    params.push(filters.role);
  }
  if (filters.register_status) {
    where.push("register_status = ?");
    params.push(filters.register_status);
  }
  const sql =
    "SELECT id, username, firstName, lastName, email, country, city, address, role, register_status, created_at FROM users" +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY id ASC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Update editable fields of a user (profile info, role, registration status).
async function update(id, fields) {
  await pool.query(
    `UPDATE users
        SET firstName = ?, lastName = ?, email = ?, country = ?, city = ?, address = ?, role = ?, register_status = ?
      WHERE id = ?`,
    [
      fields.firstName,
      fields.lastName,
      fields.email,
      fields.country,
      fields.city,
      fields.address,
      fields.role,
      fields.register_status,
      id,
    ]
  );
  return findById(id);
}

// Delete a user by id. Returns true if a row was actually removed.
async function remove(id) {
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

// Count how many accounts currently have the admin role. Used to prevent the
// system from being locked out by removing or demoting the last administrator.
async function countAdmins() {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS n FROM users WHERE role = ?",
    ["admin"]
  );
  return rows[0].n;
}

module.exports = {
  findByUsername,
  findById,
  create,
  verifyPassword,
  findAll,
  update,
  remove,
  countAdmins,
};
