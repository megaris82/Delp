const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, ticketController.list);

module.exports = router;
