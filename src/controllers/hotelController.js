const { poolPromise, sql } = require("../config/db");

// ذخیره اطلاعات هتل و آیتم‌های آن
async function saveHotelInfo(req, res) {
  const { name, phoneNumber, whatsapp, hotelName, position, address, items } =
    req.body;

  // اعتبارسنجی داده‌های ورودی
  if (!name || !phoneNumber || !whatsapp || !hotelName) {
    return res.status(400).json({
      success: false,
      message:
        "اطلاعات ضروری (نام، شماره تلفن، واتساپ و نام هتل) باید ارائه شوند.",
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
        .input("position", sql.NVarChar, position || null)
        .input("address", sql.NVarChar, address || null)
        .query(
          `INSERT INTO Hotels (Name, PhoneNumber, Whatsapp, HotelName, Position, Address) 
           VALUES (@name, @phoneNumber, @whatsapp, @hotelName, @position, @address); 
           SELECT SCOPE_IDENTITY() AS HotelId;`,
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
               VALUES (@hotelId, @name, @description);`,
            );
        }
      }

      // تایید تراکنش
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "اطلاعات هتل و آیتم‌ها با موفقیت ذخیره شدند.",
        hotelId: hotelId,
      });
    } catch (error) {
      // برگرداندن تراکنش در صورت بروز خطا
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("خطا در ذخیره اطلاعات هتل:", error.message);
    return res.status(500).json({
      success: false,
      message: "خطا در پردازش درخواست شما.",
      error: error.message,
    });
  }
}

module.exports = { saveHotelInfo };
