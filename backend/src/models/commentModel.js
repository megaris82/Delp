// Data access layer for the "comments" table (resolution notes / actions on tickets).
const { pool } = require("../db");

// Return all comments for a given ticket, joined with the author's username and role.
async function findByTicket(ticket_id) {
  const [rows] = await pool.query(
    `SELECT c.id, c.body, c.created_at, u.username AS author, u.role AS author_role
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.ticket_id = ?
     ORDER BY c.created_at ASC`,
    [ticket_id]
  );
  return rows;
}

// Create a comment and return the freshly inserted row (with author info joined).
async function create({ ticket_id, user_id, body }) {
  const [result] = await pool.query(
    `INSERT INTO comments (ticket_id, user_id, body)
     VALUES (?, ?, ?)`,
    [ticket_id, user_id, body]
  );
  const [rows] = await pool.query(
    `SELECT c.id, c.body, c.created_at, u.username AS author, u.role AS author_role
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [result.insertId]
  );
  return rows[0];
}

module.exports = { findByTicket, create };
