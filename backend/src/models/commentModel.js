const { pool } = require("../db");

// All comments for a ticket, oldest first, with the author's username and role.
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

// Create a comment, then fetch it back with the author info joined in.
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
