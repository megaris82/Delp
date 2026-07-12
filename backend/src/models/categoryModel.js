const { pool } = require("../db");

async function findAll() {
  const [rows] = await pool.query("SELECT * FROM categories ORDER BY name");
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
  return rows[0] || null;
}

async function create(category) {
  const [result] = await pool.query(
    "INSERT INTO categories (name, priority) VALUES (?, ?)",
    [category.name, category.priority]
  );
  return findById(result.insertId);
}

async function update(id, category) {
  await pool.query("UPDATE categories SET name = ?, priority = ? WHERE id = ?", [
    category.name,
    category.priority,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
