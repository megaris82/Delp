const {
  findAll,
  findMine,
  findById,
  create,
  updateStatus,
  assign,
  setResolution,
  addAttachment,
  findAttachmentsByTickets,
} = require("../models/ticketModel");
const { findById: findUserById } = require("../models/userModel");
const { TICKET_STATUSES } = require("../utils/constants");

// Groups each ticket's attachment file paths under t.attachments, so the API
// response has them nested instead of as a separate list.
function mergeAttachments(tickets, attachments) {
  const byTicket = {};
  for (const a of attachments) {
    if (!byTicket[a.ticket_id]) {
      byTicket[a.ticket_id] = [];
    }
    byTicket[a.ticket_id].push(a.file_path);
  }
  for (const t of tickets) {
    t.attachments = byTicket[t.id] || [];
  }
}

// GET /api/tickets — agents see all tickets, regular users only their own.
async function list(req, res, next) {
  try {
    const isAgent = req.user.role === "admin" || req.user.role === "technician";
    const tickets = isAgent ? await findAll() : await findMine(req.user.id);
    const ids = tickets.map((t) => t.id);
    const attachments = await findAttachmentsByTickets(ids);
    mergeAttachments(tickets, attachments);
    return res.json({ tickets });
  } catch (err) {
    next(err);
  }
}

// POST /api/tickets — a user creates a ticket, optionally with one image.
async function createTicket(req, res, next) {
  try {
    const category_id = Number(req.body.category_id);
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";

    const errors = [];
    if (!category_id) {
      errors.push("category_id is required");
    }
    if (!description) {
      errors.push("description is required");
    }
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const ticketId = await create({
      created_by: req.user.id,
      category_id: category_id,
      description: description,
    });

    // If multer saved a file, store its URL on the ticket.
    let file_path = null;
    if (req.file) {
      file_path = "/api/uploads/" + req.file.filename;
      await addAttachment({
        ticket_id: ticketId,
        uploaded_by: req.user.id,
        file_path: file_path,
      });
    }

    return res.status(201).json({
      ticket: {
        id: ticketId,
        status: "open",
        category_id: category_id,
        description: description,
        attachments: file_path ? [file_path] : [],
      },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tickets/:id — agents update status, assignee, and/or resolution.
async function updateTicket(req, res, next) {
  try {
    const ticket = await findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const errors = [];
    const { status, assigned_to, resolution } = req.body;

    if (status !== undefined) {
      if (!TICKET_STATUSES.includes(status)) {
        errors.push("status must be one of " + TICKET_STATUSES.join(", "));
      }
    }
    if (assigned_to !== undefined) {
      if (assigned_to === null) {
        // null means "unassign", which is fine.
      } else {
        const assigneeId = Number(assigned_to);
        // Number.isInteger catches strings like "abc" (which become NaN and
        // would silently pass a "Number(x) <= 0" check).
        if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
          errors.push("assigned_to must be a valid user id or null");
        } else {
          const assignee = await findUserById(assigneeId);
          if (!assignee) {
            errors.push("assigned_to must reference an existing user");
          } else if (assignee.role !== "technician" && assignee.role !== "admin") {
            errors.push("assigned_to must reference a technician or admin");
          }
        }
      }
    }
    if (resolution !== undefined && typeof resolution !== "string") {
      errors.push("resolution must be a string");
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Only run the updates for fields that were actually sent.
    if (status !== undefined) {
      await updateStatus(ticket.id, status);
    }
    if (assigned_to !== undefined) {
      await assign(ticket.id, assigned_to === null ? null : Number(assigned_to));
    }
    if (resolution !== undefined) {
      await setResolution(ticket.id, resolution);
    }

    // Return the ticket in its new state.
    const updated = await findById(ticket.id);
    const attachments = await findAttachmentsByTickets([updated.id]);
    mergeAttachments([updated], attachments);

    return res.json({ ticket: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, createTicket, updateTicket };
