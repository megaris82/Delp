// Announcement controller (admin only for mutations).
const {
  findAll,
  findById,
  create,
  update,
  remove,
} = require("../models/announcementModel");

// Validate an announcement payload (title required).
function validate(body) {
  const errors = [];
  const title = body && typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = body && typeof body.body === "string" ? body.body : "";

  if (!title) {
    errors.push("title is required");
  }

  return { errors, value: { title, body: bodyText } };
}

// GET /api/announcements  (any authenticated user)
// List all announcements.
async function list(req, res, next) {
  try {
    const announcements = await findAll();
    return res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

// POST /api/announcements  (admin)
// Create a new announcement. The author is taken from the authenticated admin.
async function createAnnouncement(req, res, next) {
  try {
    const { errors, value } = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const announcement = await create({ ...value, created_by: req.user.id });
    return res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
}

// PUT /api/announcements/:id  (admin)
// Update an existing announcement.
async function updateAnnouncement(req, res, next) {
  try {
    const existing = await findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    const { errors, value } = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const announcement = await update(req.params.id, value);
    return res.json({ announcement });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/announcements/:id  (admin)
// Delete an announcement.
async function deleteAnnouncement(req, res, next) {
  try {
    const ok = await remove(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    return res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
