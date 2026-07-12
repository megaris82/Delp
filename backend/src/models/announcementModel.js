const { pool } = require("../db");

async function findAll() {
  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.body, a.created_at, u.username AS created_by
     FROM announcements a
     LEFT JOIN users u ON a.created_by = u.id
     ORDER BY a.created_at DESC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM announcements WHERE id = ?", [id]);
  return rows[0] || null;
}

async function create(announcement) {
  const [result] = await pool.query(
    "INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)",
    [announcement.title, announcement.body, announcement.created_by]
  );
  return findById(result.insertId);
}

async function update(id, announcement) {
  await pool.query("UPDATE announcements SET title = ?, body = ? WHERE id = ?", [
    announcement.title,
    announcement.body,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
