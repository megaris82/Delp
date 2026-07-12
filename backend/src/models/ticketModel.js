const { pool } = require("../db");

async function findAll() {
  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.status,
       t.description,
       t.created_at,
       t.updated_at,
       c.name AS category,
       c.priority AS priority,
       creator.username AS created_by,
       assignee.username AS assigned_to
     FROM tickets t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users creator ON t.created_by = creator.id
     LEFT JOIN users assignee ON t.assigned_to = assignee.id
     ORDER BY t.created_at DESC`
  );
  return rows;
}

module.exports = { findAll };
