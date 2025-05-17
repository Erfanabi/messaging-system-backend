const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const { poolPromise, sql } = require("./config/db");
const { createUsersTable: initTable } = require("./config/initDb");

const app = express();

// Middleware
app.use(cors()); // Enabling Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON request body
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data

// Create Users table if not exists
initTable();

// WallMessage API URL and credentials (should be stored in .env for security)
const WALLMESSAGE_API_URL = process.env.WALLMESSAGE_API_URL;
const WALLMESSAGE_APP_KEY = process.env.WALLMESSAGE_APP_KEY;
const WALLMESSAGE_AUTH_KEY = process.env.WALLMESSAGE_AUTH_KEY;

// Path to the resume file
const RESUME_FILE_PATH = "./public/resume.pdf";

// Route for sending WhatsApp message
app.post("/send-whatsapp", async (req, res) => {
  const { name, phone } = req.body;

  // Validate and format phone number
  const formattedPhone = formatPhoneNumber(phone);

  if (!formattedPhone) {
    return res.status(400).json({
      success: false,
      message: "Phone number must start with 0 or country code (+xx)",
    });
  }

  try {
    // Store user info in MSSQL database
    await storeUserToDatabase(name, formattedPhone);

    // Prepare message
    const message = `Hello ${name}, This is from Hotelex Holding. https://hotelex.ae/catalog/`;

    // Send message via WallMessage API
    await sendMessage(formattedPhone, message);

    return res.status(200).json({
      success: true,
      message: "Message sent successfully! This is from Hotelex Holding.",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error processing your request.",
    });
  }
});

// Function to format phone number
function formatPhoneNumber(phone) {
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith("0")) {
    return "+98" + formattedPhone.slice(1); // Change leading 0 to country code +98
  } else if (formattedPhone.startsWith("+")) {
    return formattedPhone;
  }
  return null; // Invalid phone format
}

// Function to store user information in the database
async function storeUserToDatabase(name, formattedPhone) {
  const pool = await poolPromise;
  await pool
    .request()
    .input("name", sql.NVarChar, name)
    .input("phone", sql.NVarChar, formattedPhone)
    .query("INSERT INTO Users (Name, Phone) VALUES (@name, @phone)");
  console.log(
    `User ${name} with phone number ${formattedPhone} has been saved to the database`,
  );
}

// Function to send message via WallMessage API
async function sendMessage(phone, message) {
  const body = {
    appkey: WALLMESSAGE_APP_KEY,
    authkey: WALLMESSAGE_AUTH_KEY,
    to: phone,
    message: message,
  };

  try {
    await axios.post(WALLMESSAGE_API_URL, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    throw new Error(error.response ? error.response.data : error.message);
  }
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
