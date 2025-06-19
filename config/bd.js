require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
}).promise();

// Testar conexão
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conectado ao banco de dados!");
    conn.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
  }
})();

module.exports = pool; // Exportando com suporte a async/await
