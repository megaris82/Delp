// Category management controller (admin only for mutations).
const {
  findAll,
  findById,
  create,
  update,
  remove,
} = require("../models/categoryModel");
const { PRIORITIES } = require("../utils/constants");

// Validate a category payload (name required, priority must be valid).
function validate(body) {
  const errors = [];
  const name = body && typeof body.name === "string" ? body.name.trim() : "";
  const priority = (body && body.priority) || "medium";

  if (!name) {
    errors.push("name is required");
  }
  if (!PRIORITIES.includes(priority)) {
    errors.push("priority must be one of low, medium, high");
  }

  return { errors, value: { name, priority } };
}

// GET /api/categories  (any authenticated user)
// List all categories.
async function list(req, res, next) {
  try {
    const categories = await findAll();
    return res.json({ categories });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories  (admin)
// Create a new category.
async function createCategory(req, res, next) {
  try {
    const { errors, value } = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const category = await create(value);
    return res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id  (admin)
// Update an existing category.
async function updateCategory(req, res, next) {
  try {
    const existing = await findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }
    const { errors, value } = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    const category = await update(req.params.id, value);
    return res.json({ category });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id  (admin)
// Delete a category.
async function deleteCategory(req, res, next) {
  try {
    const ok = await remove(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "Category not found" });
    }
    return res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, createCategory, updateCategory, deleteCategory };
