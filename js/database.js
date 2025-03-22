const { Pool } = require('pg'); // Importa o Pool do módulo pg

const pool = new Pool({
    user: 'postgres', // Substitua pelo seu usuário do PostgreSQL
    host: 'localhost',
    database: 'JULAOS_BURGER', // Nome do banco de dados
    password: '310705', // Substitua pela sua senha do PostgreSQL (ou omita se não tiver senha)
    port: 5432, // Porta padrão do PostgreSQL
});

module.exports = pool;