const { poolPromise } = require("./db");

const createUsersTable = async () => {
  try {
    const pool = await poolPromise;
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      BEGIN
        CREATE TABLE Users (
          Id INT PRIMARY KEY IDENTITY(1,1),
          Name NVARCHAR(100) NOT NULL,
          Phone NVARCHAR(20) NOT NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END
    `;
    await pool.request().query(query);
    console.log("✅ Table 'Users' is ready");
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
  }
};

module.exports = { createUsersTable };
