const mysql = require('mysql2');

// Configuração da conexão com o MySQL
const pool = mysql.createPool({
    host: 'localhost', // Endereço do banco de dados
    user: 'root', // Usuário do MySQL
    password: '#Julio310705', // Senha do MySQL
    database: 'JULAOS_BURGER', // Nome do banco de dados
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexões
    queueLimit: 0,
});

// Exporta a conexão
module.exports = pool.promise(); // Usando promises para async/await