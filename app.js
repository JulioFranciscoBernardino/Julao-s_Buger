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
const horarioFuncionamentoRoutes = require('./routes/horarioFuncionamentoRoutes');
const taxaEntregaRoutes = require('./routes/taxaEntregaRoutes');
const distanciaRoutes = require('./routes/distanciaRoutes');
const rotas = require('./routes/index');
const viewRoutes = require('./routes/viewRoutes');


// Configurar timezone para Brasília (UTC-3)
process.env.TZ = 'America/Sao_Paulo';

// Inicialização do app
const app = express();
const PORT = process.env.PORT || 3000;
const IP = process.env.IP || '';


// Middlewares globais
app.use(express.json());
app.use(cors());

// Configuração CSP - SEMPRE bloquear imagens externas (mesmo em desenvolvimento)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://gc.kis.v2.scr.kaspersky-labs.com", "https://code.jquery.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://gc.kis.v2.scr.kaspersky-labs.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'", "https://viacep.com.br", "https://maps.googleapis.com", "https://gc.kis.v2.scr.kaspersky-labs.com"],
      }
    }
  }));

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
app.use('/api/horarios-funcionamento', horarioFuncionamentoRoutes);
app.use('/api/taxas-entrega', taxaEntregaRoutes);
app.use('/api/distancia', distanciaRoutes);
app.use('/', rotas);
app.use('/', viewRoutes);

// Tratamento de erros não capturados para evitar que o servidor quebre
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection');
    // Não encerrar o processo, apenas logar o erro
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception');
    // Para erros críticos, pode ser necessário encerrar manualmente
});

// Inicialização do servidor
app.listen(PORT, IP, () => {
    console.log('Servidor iniciado');
});

