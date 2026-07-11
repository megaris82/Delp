const express = require("express");
const path = require("path");
const { testConnection } = require("./db");

const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

testConnection().catch((err) => {
  console.error("Could not connect to MySQL:", err.message);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
