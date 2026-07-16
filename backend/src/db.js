// Load environment variables from the .env file (DB credentials, JWT secret, etc.).
require("dotenv").config();

// MySQL driver (promise-based variant for async/await usage).
const mysql = require("mysql2/promise");

// Create a connection pool so the app can reuse DB connections efficiently.
// Values fall back to sensible defaults when the env vars are not provided.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "helpdesk",
  password: process.env.DB_PASSWORD || "helpdeskpass",
  database: process.env.DB_NAME || "helpdesk",
  dateStrings: true,         // return DATE/DATETIME columns as strings instead of JS Date objects
                             // (no `timezone` option: mysql2 only accepts offsets, and with
                             //  dateStrings the raw server value is passed through unchanged,
                             //  so the DB's Europe/Athens zone is what matters)
  waitForConnections: true,  // queue requests when all connections are in use
  connectionLimit: 10,       // maximum number of connections kept in the pool
});

// Export the pool so the models can run queries against the database.
module.exports = { pool };
