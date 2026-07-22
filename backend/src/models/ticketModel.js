const { pool } = require("../db");

// The SELECT used for listing/reading tickets. Joins the category and the
// creator/assignee usernames so the API can show readable labels instead of ids.
const COLUMNS = `
  SELECT
    t.id,
    t.status,
    t.description,
    t.resolution,
    t.created_at,
    t.updated_at,
    c.name AS category,
    c.priority AS priority,
    creator.username AS created_by_name,
    creator.id       AS created_by_id,
    assignee.username AS assigned_to_name,
    assignee.id       AS assigned_to_id
  FROM tickets t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN users creator ON t.created_by = creator.id
  LEFT JOIN users assignee ON t.assigned_to = assignee.id
`;

// All tickets, newest first (used by agents).
async function findAll() {
  const [rows] = await pool.query(
    COLUMNS + " ORDER BY t.created_at DESC"
  );
  return rows;
}

// Tickets created by one user (used by regular users).
async function findMine(createdBy) {
  const [rows] = await pool.query(
    COLUMNS + " WHERE t.created_by = ? ORDER BY t.created_at DESC",
    [createdBy]
  );
  return rows;
}

// One ticket by id.
async function findById(id) {
  const [rows] = await pool.query(COLUMNS + " WHERE t.id = ?", [id]);
  return rows[0] || null;
}

// Insert a new ticket. Status defaults to "open" in the database.
async function create({ created_by, category_id, description }) {
  const [result] = await pool.query(
    `INSERT INTO tickets (created_by, category_id, description)
     VALUES (?, ?, ?)`,
    [created_by, category_id, description]
  );
  return result.insertId;
}

async function updateStatus(id, status) {
  await pool.query("UPDATE tickets SET status = ? WHERE id = ?", [status, id]);
}

// Assign a ticket to a technician, or pass null to unassign it.
async function assign(id, assigned_to) {
  await pool.query("UPDATE tickets SET assigned_to = ? WHERE id = ?", [
    assigned_to,
    id,
  ]);
}

async function setResolution(id, resolution) {
  await pool.query("UPDATE tickets SET resolution = ? WHERE id = ?", [
    resolution,
    id,
  ]);
}

// Save the path of an uploaded file against a ticket.
async function addAttachment({ ticket_id, uploaded_by, file_path }) {
  const [result] = await pool.query(
    `INSERT INTO attachments (ticket_id, uploaded_by, file_path)
     VALUES (?, ?, ?)`,
    [ticket_id, uploaded_by, file_path]
  );
  return result.insertId;
}

// All attachment rows for the given ticket ids. Used to merge file paths into
// the ticket objects in the controller.
async function findAttachmentsByTickets(ids) {
  if (!ids.length) {
    return [];
  }
  const [rows] = await pool.query(
    `SELECT ticket_id, file_path
     FROM attachments
     WHERE ticket_id IN (?)`,
    [ids]
  );
  return rows;
}

// Find an attachment by its stored filename. Returns the ticket id and the
// ticket creator's id so /api/uploads can check who's allowed to view it.
async function findAttachmentByFilename(filename) {
  const [rows] = await pool.query(
    `SELECT a.ticket_id AS ticket_id, t.created_by AS created_by
     FROM attachments a
     JOIN tickets t ON a.ticket_id = t.id
     WHERE a.file_path = ?`,
    ["/api/uploads/" + filename]
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findMine,
  findById,
  create,
  updateStatus,
  assign,
  setResolution,
  addAttachment,
  findAttachmentsByTickets,
  findAttachmentByFilename,
};
