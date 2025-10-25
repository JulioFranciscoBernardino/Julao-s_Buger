require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importação de rotas
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const opcionalRoutes = require('./routes/opcionalRoutes');
const grupoOpcionalRoutes = require('./routes/grupoOpcionalRoutes');
const produtoGrupoOpcionalRoutes = require('./routes/produtoGrupoOpcionalRoutes');
const cardapioRoutes = require('./routes/cardapioAdmRoutes');
const enderecoRoutes = require('./routes/enderecoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const formaPagamentoRoutes = require('./routes/formaPagamentoRoutes');
const rotas = require('./routes/index');
const viewRoutes = require('./routes/viewRoutes');


// Inicialização do app
const app = express();
const PORT = process.env.PORT || 3000;
const IP = process.env.IP || '';


// Middlewares globais
app.use(express.json());
app.use(cors());
// Configuração CSP baseada no ambiente
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://gc.kis.v2.scr.kaspersky-labs.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://gc.kis.v2.scr.kaspersky-labs.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    }
  }));
} else {
  // Desenvolvimento - CSP mais permissivo
  app.use(helmet({
    contentSecurityPolicy: false
  }));
}

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'view'))); 

// Rotas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/opcionais', opcionalRoutes);
app.use('/api/grupos-opcionais', grupoOpcionalRoutes);
app.use('/api/produto-grupo-opcionais', produtoGrupoOpcionalRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/formas-pagamento', formaPagamentoRoutes);
app.use('/', rotas);
app.use('/', viewRoutes);

// Inicialização do servidor
app.listen(PORT, IP,() => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
    console.log(`🌐 Abra no navegador: http://localhost:${PORT}`);
});

