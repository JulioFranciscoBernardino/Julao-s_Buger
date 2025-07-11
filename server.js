require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importação de rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const cardapioRoutes = require('./routes/cardapioAdmRoutes');
const rotas = require('./routes/index');
const viewRoutes = require('./routes/viewRoutes');


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
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/', cardapioRoutes);
app.use('/', rotas);
app.use('/', viewRoutes);

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
