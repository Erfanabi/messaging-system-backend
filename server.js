const express = require("express");
const cors = require("cors");
const { createUsersTable: initTable } = require("./src/config/initDb");
const { createHotelsTable, createItemsTable } = require("./src/config/hotelDb");
const hotelRoutes = require("./src/routes/hotelRoutes");
const messageRoutes = require("./src/routes/messageRoutes");

const app = express();

// Middleware
app.use(cors()); // Enabling Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON request body
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data

// Create tables if not exists
// initTable();
createHotelsTable();
createItemsTable();

// Use routes
app.use("/api", hotelRoutes);
app.use("/api", messageRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
