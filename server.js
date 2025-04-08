const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/bd');
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

const app = express();
const PORT = 3000;

app.use(express.json()); // Permite receber JSON no corpo das requisições
app.use(cors()); // Libera CORS para requisições do frontend
app.use(helmet()); // Segurança básica para evitar vulnerabilidades
app.use(express.static('public'));
app.use('/', produtoRoutes);

// Middleware de segurança para limitar requisições
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições
    message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);

app.use('/api/usuarios', usuarioRoutes);
app.use(produtoRoutes);
app.set('view engine', 'ejs');
app.use(express.static('public')); // Para servir arquivos estáticos, se necessário
app.set('views', './views');
app.set('view engine', 'ejs');


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
