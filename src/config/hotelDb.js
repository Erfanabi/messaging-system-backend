const { poolPromise } = require("./db");

const createHotelsTable = async () => {
  try {
    const pool = await poolPromise;
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Hotels' AND xtype='U')
      BEGIN
        CREATE TABLE Hotels (
          Id INT PRIMARY KEY IDENTITY(1,1),
          Name NVARCHAR(100) NOT NULL,
          PhoneNumber NVARCHAR(20) NOT NULL,
          Whatsapp NVARCHAR(20) NOT NULL,
          HotelName NVARCHAR(100) NOT NULL,
          Position NVARCHAR(MAX),
          Address NVARCHAR(200),
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END
    `;
    await pool.request().query(query);
    console.log("✅ Table 'Hotels' is ready");
  } catch (err) {
    console.error("❌ Error creating Hotels table:", err.message);
  }
};

const createItemsTable = async () => {
  try {
    const pool = await poolPromise;
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Items' AND xtype='U')
      BEGIN
        CREATE TABLE Items (
          Id INT PRIMARY KEY IDENTITY(1,1),
          HotelId INT NOT NULL,
          Name NVARCHAR(100) NOT NULL,
          Description NVARCHAR(MAX),
          CreatedAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (HotelId) REFERENCES Hotels(Id)
        );
      END
    `;
    await pool.request().query(query);
    console.log("✅ Table 'Items' is ready");
  } catch (err) {
    console.error("❌ Error creating Items table:", err.message);
  }
};

module.exports = { createHotelsTable, createItemsTable };
