const {
  findAll,
  findById,
  create,
  update,
  remove,
} = require("../models/announcementModel");

function validate(body) {
  const errors = [];
  const title = body && typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = body && typeof body.body === "string" ? body.body : "";

  if (!title) {
    errors.push("title is required");
  }

  return { errors, value: { title, body: bodyText } };
}

async function list(req, res, next) {
  try {
    const announcements = await findAll();
    return res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

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
