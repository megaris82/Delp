const { findByTicket, create } = require("../models/commentModel");
const { findById } = require("../models/ticketModel");

// GET /api/tickets/:id/comments — returns the comments on a ticket. Regular
// users can only read comments on their own tickets; agents can read any.
async function list(req, res, next) {
  try {
    const ticket = await findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const isAgent = req.user.role === "admin" || req.user.role === "technician";
    if (!isAgent && ticket.created_by_name !== req.user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const comments = await findByTicket(req.params.id);
    return res.json({ comments });
  } catch (err) {
    next(err);
  }
}

// POST /api/tickets/:id/comments — an agent adds a comment/note to a ticket.
async function addComment(req, res, next) {
  try {
    const ticketId = req.params.id;
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
