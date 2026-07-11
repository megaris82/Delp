const { pool } = require("../db");
const bcrypt = require("bcryptjs");

async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, username, firstName, lastName, email, country, city, address, role, register_status, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

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

async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { findByUsername, findById, create, verifyPassword };
