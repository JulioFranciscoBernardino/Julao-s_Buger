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
const whatsappRoutes = require('./routes/whatsappRoutes');
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
app.use('/api/whatsapp', whatsappRoutes);
app.use('/', rotas);
app.use('/', viewRoutes);

// Tratamento de erros não capturados para evitar que o servidor quebre
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Não encerrar o processo, apenas logar o erro
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Se for erro relacionado ao WhatsApp, não encerrar o servidor
    if (error.message && error.message.includes('whatsapp')) {
        console.error('Erro do WhatsApp ignorado para manter servidor rodando');
        return;
    }
    // Para outros erros críticos, pode ser necessário encerrar
});

// Inicialização do servidor
app.listen(PORT, IP, async () => {
    console.log(`Servidor rodando na porta ${PORT} 🚀`);
    console.log(`🌐 Abra no navegador: http://localhost:${PORT}`);
    
    // Inicializar WhatsApp automaticamente ao iniciar o servidor
    try {
        const whatsappService = require('./services/whatsappService');
        console.log('📱 Inicializando WhatsApp automaticamente...');
        await whatsappService.initialize();
        console.log('✅ WhatsApp inicializado! Se necessário, escaneie o QR Code exibido acima.');
    } catch (error) {
        console.error('⚠️ Erro ao inicializar WhatsApp automaticamente:', error.message);
        console.log('💡 Você pode inicializar manualmente acessando /whatsapp-admin');
    }
});

