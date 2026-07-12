// Data access layer for the "announcements" table.
const { pool } = require("../db");

// Return all announcements ordered by creation date (newest first),
// joined with the username of the author.
async function findAll() {
  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.body, a.created_at, u.username AS created_by
     FROM announcements a
     LEFT JOIN users u ON a.created_by = u.id
     ORDER BY a.created_at DESC`
  );
  return rows;
}

// Return a single announcement by id.
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM announcements WHERE id = ?", [id]);
  return rows[0] || null;
}

// Create a new announcement. `created_by` is the id of the admin who posted it.
async function create(announcement) {
  const [result] = await pool.query(
    "INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)",
    [announcement.title, announcement.body, announcement.created_by]
  );
  return findById(result.insertId);
}

// Update an announcement's title and body.
async function update(id, announcement) {
  await pool.query("UPDATE announcements SET title = ?, body = ? WHERE id = ?", [
    announcement.title,
    announcement.body,
    id,
  ]);
  return findById(id);
}

// Delete an announcement by id. Returns true if a row was removed.
async function remove(id) {
  const [result] = await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
