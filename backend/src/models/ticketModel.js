// Data access layer for the "tickets" table and its related attachments.
const { pool } = require("../db");

// Shared SELECT that joins tickets with their category and the usernames of the
// creator and the assigned technician, so the API can return readable labels.
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
    creator.username AS created_by,
    assignee.username AS assigned_to
  FROM tickets t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN users creator ON t.created_by = creator.id
  LEFT JOIN users assignee ON t.assigned_to = assignee.id
`;

// Allowed ticket statuses (used for validation in the controller).
const STATUSES = ["open", "in_progress", "closed"];

// Return every ticket (used by admins / technicians).
async function findAll() {
  const [rows] = await pool.query(
    COLUMNS + " ORDER BY t.created_at DESC"
  );
  return rows;
}

// Return tickets created by a specific user (used by regular users).
async function findMine(createdBy) {
  const [rows] = await pool.query(
    COLUMNS + " WHERE t.created_by = ? ORDER BY t.created_at DESC",
    [createdBy]
  );
  return rows;
}

// Return a single ticket by id.
async function findById(id) {
  const [rows] = await pool.query(COLUMNS + " WHERE t.id = ?", [id]);
  return rows[0] || null;
}

// Create a new ticket (status defaults to "open" in the database).
async function create({ created_by, category_id, description }) {
  const [result] = await pool.query(
    `INSERT INTO tickets (created_by, category_id, description)
     VALUES (?, ?, ?)`,
    [created_by, category_id, description]
  );
  return result.insertId;
}

// Update only the status of a ticket.
async function updateStatus(id, status) {
  await pool.query("UPDATE tickets SET status = ? WHERE id = ?", [status, id]);
}

// Assign (or unassign, with NULL) a ticket to a technician.
async function assign(id, assigned_to) {
  await pool.query("UPDATE tickets SET assigned_to = ? WHERE id = ?", [
    assigned_to,
    id,
  ]);
}

// Set the resolution text of a ticket.
async function setResolution(id, resolution) {
  await pool.query("UPDATE tickets SET resolution = ? WHERE id = ?", [
    resolution,
    id,
  ]);
}

// Attach an uploaded file path to a ticket.
async function addAttachment({ ticket_id, uploaded_by, file_path }) {
  const [result] = await pool.query(
    `INSERT INTO attachments (ticket_id, uploaded_by, file_path)
     VALUES (?, ?, ?)`,
    [ticket_id, uploaded_by, file_path]
  );
  return result.insertId;
}

// Return all attachment rows for a list of ticket ids (used to merge file
// paths into the ticket objects in the controller).
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

// Look up an attachment by its stored file name (e.g. "<random>.jpg"). Returns
// the owning ticket id and the ticket creator's id so the API can decide
// whether the requester is allowed to view the file.
async function findAttachmentByFilename(filename) {
  const [rows] = await pool.query(
    `SELECT a.ticket_id AS ticket_id, t.created_by AS created_by
     FROM attachments a
     JOIN tickets t ON a.ticket_id = t.id
     WHERE a.file_path LIKE ?`,
    ["%/" + filename]
  );
  return rows[0] || null;
}

module.exports = {
  STATUSES,
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
