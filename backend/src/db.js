// Loads the .env file so DB credentials and the JWT secret are available.
require("dotenv").config();

const mysql = require("mysql2/promise");

// One shared pool keeps a few DB connections open and reuses them, which is
// faster than opening a new connection for every query.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "helpdesk",
  password: process.env.DB_PASSWORD || "helpdeskpass",
  database: process.env.DB_NAME || "helpdesk",
  // Return dates as strings instead of JS Date objects, so the value the DB
  // stores (in Europe/Athens time) is passed through unchanged.
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = { pool };
