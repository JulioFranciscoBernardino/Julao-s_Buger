const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes'); // Arquivo onde está o cadastro
const pool = require('./database'); // Conexão com o MySQL

const app = express();
const PORT = 3000;

app.use(express.json()); // Permite receber JSON no corpo das requisições
app.use(cors()); // Libera CORS para requisições do frontend
app.use(helmet()); // Segurança básica para evitar vulnerabilidades

// Middleware de segurança para limitar requisições
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições
    message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

// 🔥 Corrigindo a definição das rotas
app.use('/api', routes);  // Agora todas as rotas serão chamadas com o prefixo /api

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
