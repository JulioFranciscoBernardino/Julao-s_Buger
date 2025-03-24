const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');  // Importa as rotas definidas acima
const pool = require('./database');    // Conexão com o MySQL

const app = express();
const PORT = 3000;

// Middleware para interpretar JSON nas requisições
app.use(express.json());

// Configuração de CORS para permitir acesso de origens específicas
app.use(cors({ origin: 'http://seu-front-end.com' })); 

// Middleware de segurança com Helmet (ajuda a proteger contra ataques comuns)
app.use(helmet());

// Rate Limiting para limitar o número de requisições por IP (protege contra ataques de força bruta)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,                // Limite de 100 requisições por IP
    message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// Usa as rotas definidas no arquivo routes.js
app.use(routes);

// Middleware global para tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro interno:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Testa a conexão com o banco de dados
pool.query('SELECT 1 + 1 AS result')
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida');
    })
    .catch((err) => {
        console.error('Erro ao conectar ao banco de dados:', err);
    });

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
