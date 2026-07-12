// Category routes: listing (all) and admin management.
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middleware/auth");

// GET    /api/categories       -> list categories
router.get("/", authenticate, categoryController.list);
// POST   /api/categories       -> create a category (admin)
router.post("/", authenticate, authorize("admin"), categoryController.createCategory);
// PUT    /api/categories/:id   -> update a category (admin)
router.put("/:id", authenticate, authorize("admin"), categoryController.updateCategory);
// DELETE /api/categories/:id   -> delete a category (admin)
router.delete("/:id", authenticate, authorize("admin"), categoryController.deleteCategory);

module.exports = router;
