const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middleware/auth");

// List categories (anyone logged in).
router.get("/", authenticate, categoryController.list);
// Create / update / delete a category (admin only).
router.post("/", authenticate, authorize("admin"), categoryController.createCategory);
router.put("/:id", authenticate, authorize("admin"), categoryController.updateCategory);
router.delete("/:id", authenticate, authorize("admin"), categoryController.deleteCategory);

module.exports = router;
