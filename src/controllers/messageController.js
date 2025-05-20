const { poolPromise, sql } = require("../config/db");
const axios = require("axios");

// تنظیمات API وال مسیج
const WALLMESSAGE_API_URL = process.env.WALLMESSAGE_API_URL;
const WALLMESSAGE_APP_KEY = process.env.WALLMESSAGE_APP_KEY;
const WALLMESSAGE_AUTH_KEY = process.env.WALLMESSAGE_AUTH_KEY;

// ارسال پیام واتساپ و ذخیره اطلاعات
async function sendWhatsAppAndSaveInfo(req, res) {
  const { name, phoneNumber, whatsapp, hotelName, description, positionAddress, items } = req.body;

  // اعتبارسنجی داده‌های ورودی
  if (!name || !phoneNumber || !whatsapp || !hotelName) {
    return res.status(400).json({
      success: false,
      message: "اطلاعات ضروری (نام، شماره تلفن، واتساپ و نام هتل) باید ارائه شوند.",
    });
  }

  try {
    const pool = await poolPromise;
    
    // شروع تراکنش
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // ذخیره اطلاعات هتل
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
           SELECT SCOPE_IDENTITY() AS HotelId;`
        );

      const hotelId = hotelResult.recordset[0].HotelId;

      // ذخیره آیتم‌ها در صورت وجود
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await new sql.Request(transaction)
            .input("hotelId", sql.Int, hotelId)
            .input("name", sql.NVarChar, item.name)
            .input("description", sql.NVarChar, item.description || null)
            .query(
              `INSERT INTO Items (HotelId, Name, Description) 
               VALUES (@hotelId, @name, @description);`
            );
        }
      }

      // ارسال پیام واتساپ
      const formattedPhone = formatPhoneNumber(whatsapp);
      if (!formattedPhone) {
        throw new Error("شماره واتساپ باید با 0 یا کد کشور (+xx) شروع شود.");
      }

      const message = `سلام ${name}،
اطلاعات هتل ${hotelName} با موفقیت ثبت شد.
https://hotelex.ae/catalog/`;
      
      await sendMessage(formattedPhone, message);

      // تایید تراکنش
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "اطلاعات با موفقیت ذخیره و پیام ارسال شد.",
        hotelId: hotelId,
      });
    } catch (error) {
      // برگرداندن تراکنش در صورت بروز خطا
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("خطا در پردازش درخواست:", error.message);
    return res.status(500).json({
      success: false,
      message: "خطا در پردازش درخواست شما.",
      error: error.message,
    });
  }
}

// تبدیل فرمت شماره تلفن
function formatPhoneNumber(phone) {
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith("0")) {
    return "+98" + formattedPhone.slice(1); // تبدیل 0 ابتدایی به کد کشور +98
  } else if (formattedPhone.startsWith("+")) {
    return formattedPhone;
  }
  return null; // فرمت نامعتبر شماره تلفن
}

// ارسال پیام از طریق API وال مسیج
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

module.exports = { sendWhatsAppAndSaveInfo };