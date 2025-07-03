require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importação de rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const cardapioController = require('./routes/cardapioCategoriaRoutes');
const rotas = require('./routes/index');


// Inicialização do app
const app = express();
const PORT = process.env.PORT || 3000;


// Middlewares globais
app.use(express.json());
app.use(cors());
app.use(helmet());

// View engine - EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'viewHTML'))); 

// Rotas
app.use('/', usuarioRoutes);
app.use('/', produtoRoutes);
app.use('/', categoriaRoutes);
app.use('/', cardapioController);
app.use('/', rotas);

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
