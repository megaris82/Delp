// Comment controller: list and add comments/actions on a ticket (admin, technician only for writes).
const { findByTicket, create } = require("../models/commentModel");
const { findById } = require("../models/ticketModel");

// GET /api/tickets/:id/comments
// Return all comments for a ticket. A regular user may only read comments on
// tickets they created; agents (admin / technician) may read any ticket.
async function list(req, res, next) {
  try {
    const ticket = await findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const isAgent = req.user.role === "admin" || req.user.role === "technician";
    if (!isAgent && ticket.created_by !== req.user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const comments = await findByTicket(req.params.id);
    return res.json({ comments });
  } catch (err) {
    next(err);
  }
}

// POST /api/tickets/:id/comments  (admin, technician)
// Add a comment / resolution note to a ticket.
async function addComment(req, res, next) {
  try {
    const ticketId = req.params.id;
    // The ticket must exist before a comment can be attached.
    const ticket = await findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
    if (!body) {
      return res.status(400).json({ error: "Comment body is required" });
    }
    const comment = await create({
      ticket_id: ticketId,
      user_id: req.user.id,
      body: body,
    });
    return res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, addComment };
