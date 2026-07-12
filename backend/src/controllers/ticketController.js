const { findAll } = require("../models/ticketModel");

async function list(req, res, next) {
  try {
    const tickets = await findAll();
    return res.json({ tickets });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
