const { poolPromise, sql } = require("../config/db");
const axios = require("axios");

// WallMessage API configuration
const WALLMESSAGE_API_URL = process.env.WALLMESSAGE_API_URL;
const WALLMESSAGE_APP_KEY = process.env.WALLMESSAGE_APP_KEY;
const WALLMESSAGE_AUTH_KEY = process.env.WALLMESSAGE_AUTH_KEY;

// Handle saving information to database and sending WhatsApp message
async function sendWhatsAppAndSaveInfo(req, res) {
  const {
    name,
    phoneNumber,
    whatsapp,
    hotelName,
    description,
    positionAddress,
    items,
  } = req.body;

  // Validate input data
  if (!name || !phoneNumber || !whatsapp || !hotelName) {
    return res.status(400).json({
      success: false,
      message:
        "Required fields (name, phone number, WhatsApp, and hotel name) must be provided.",
    });
  }

  let pool;
  let transaction;
  let hotelId;

  try {
    pool = await poolPromise;

    // Start a database transaction
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Save hotel information to database
      const hotelResult = await new sql.Request(transaction)
        .input("name", sql.NVarChar, name)
        .input("phoneNumber", sql.NVarChar, phoneNumber)
        .input("whatsapp", sql.NVarChar, whatsapp)
        .input("hotelName", sql.NVarChar, hotelName)
        .input("description", sql.NVarChar, description || null)
        .input("positionAddress", sql.NVarChar, positionAddress || null)
        .query(
          `INSERT INTO Hotels (Name, PhoneNumber, Whatsapp, HotelName, Description, PositionAddress) 
           VALUES (@name, @phoneNumber, @whatsapp, @hotelName, @description, @positionAddress); 
           SELECT SCOPE_IDENTITY() AS HotelId;`,
        );

      hotelId = hotelResult.recordset[0].HotelId;

      // Save items to database if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await new sql.Request(transaction)
            .input("hotelId", sql.Int, hotelId)
            .input("name", sql.NVarChar, item.name)
            .input("description", sql.NVarChar, item.description || null)
            .query(
              `INSERT INTO Items (HotelId, Name, Description) 
               VALUES (@hotelId, @name, @description);`,
            );
        }
      }

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

    // Send WhatsApp message after saving to database
    try {
      const formattedPhone = formatPhoneNumber(whatsapp);
      if (!formattedPhone) {
        throw new Error(
          "WhatsApp number must start with a country code (+xx).",
        );
      }

      const message = `Hello ${name},
Your hotel ${hotelName} has been successfully registered.
https://hotelex.ae/catalog/`;

      await sendMessage(formattedPhone, message);

      return res.status(201).json({
        success: true,
        message: "Information saved and WhatsApp message sent successfully.",
        hotelId: hotelId,
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error.message);
      return res.status(201).json({
        success: true,
        message:
          "Information saved successfully, but failed to send WhatsApp message.",
        hotelId: hotelId,
        warning: error.message,
      });
    }
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error processing your request.",
      error: error.message,
    });
  }
}

// Format phone number for WhatsApp
function formatPhoneNumber(phone) {
  let formattedPhone = phone.trim();
  // Accept numbers starting with + and having at least 10 characters
  if (formattedPhone.startsWith("+") && formattedPhone.length >= 10) {
    return formattedPhone;
  }
  // Convert numbers starting with 0 to +98 (Iran country code)
  if (formattedPhone.startsWith("0")) {
    return "+98" + formattedPhone.slice(1);
  }
  return null; // Invalid phone number format
}

// Send message via WallMessage API
async function sendMessage(phone, message) {
  const body = {
    appkey: WALLMESSAGE_APP_KEY,
    authkey: WALLMESSAGE_AUTH_KEY,
    to: phone,
    message: message,
  };

  try {
    const response = await axios.post(WALLMESSAGE_API_URL, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response ? error.response.data : error.message);
  }
}

module.exports = { sendWhatsAppAndSaveInfo };
