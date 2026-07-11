require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "helpdesk",
  timezone: "Europe/Athens",
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log("Connected to MySQL database");
}

module.exports = { pool, testConnection };
