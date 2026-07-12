const {
  findAll,
  findById,
  create,
  update,
  remove,
} = require("../models/categoryModel");

const PRIORITIES = ["low", "medium", "high"];

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

async function list(req, res, next) {
  try {
    const categories = await findAll();
    return res.json({ categories });
  } catch (err) {
    next(err);
  }
}

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
