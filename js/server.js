const express = require('express');
const routes = require('./routes'); // Importa as rotas
const pool = require('./database'); // Importa a conexão com o MySQL

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Usar as rotas
app.use(routes);

// Testar conexão com o banco de dados
pool.query('SELECT 1 + 1 AS result')
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida');
    })
    .catch((err) => {
        console.error('Erro ao conectar ao banco de dados:', err);
    });

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});