require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'julaos_burger',
    port: process.env.DB_PORT || 3306,
    timezone: '-03:00' // Horário de Brasília (UTC-3)
}).promise();

// Interceptar novas conexões para configurar timezone de Brasília
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '-03:00'");
});

// Testar conexão e configurar timezone
(async () => {
  try {
    const conn = await pool.getConnection();
    // Configurar timezone para Brasília (UTC-3)
    await conn.query("SET time_zone = '-03:00'");
    console.log("✅ Conectado ao banco de dados! (Timezone: Brasília UTC-3)");
    conn.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
  }
})();

module.exports = pool; // Exportando com suporte a async/await
