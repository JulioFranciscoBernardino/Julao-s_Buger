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

// Arquivos estáticos - servidos diretamente do servidor
// Isso garante que as imagens sejam acessíveis tanto localmente quanto no AlwaysData
const imgsPath = path.join(__dirname, 'public', 'imgs');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Verificar se o diretório de imagens existe
if (!fs.existsSync(imgsPath)) {
  fs.mkdirSync(imgsPath, { recursive: true });
}

// URL do servidor AlwaysData (configurar no .env como ALWAYSDATA_URL)
// Prioriza a URL manual do .env, se não configurado, tenta detectar automaticamente do DB_SERVER
let ALWAYSDATA_URL = process.env.ALWAYSDATA_URL ? process.env.ALWAYSDATA_URL.trim() : null;

if (!ALWAYSDATA_URL && process.env.DB_SERVER) {
  // Extrair o domínio do DB_SERVER (ex: mysql-julaos.alwaysdata.net -> julaos.alwaysdata.net)
  const dbServer = process.env.DB_SERVER;
  const match = dbServer.match(/([^.]+)\.alwaysdata\.net/);
  if (match) {
    const accountName = match[1].replace(/^mysql-/, ''); // Remove prefixo mysql- se existir
    ALWAYSDATA_URL = `https://${accountName}.alwaysdata.net`;
  }
}

// Middleware para buscar imagens do AlwaysData se não existirem localmente
// IMPORTANTE: Este middleware deve vir ANTES do express.static
app.use('/imgs', (req, res, next) => {
  const filePath = path.join(imgsPath, req.path);
  
  // Se a imagem existe localmente, passar para o próximo middleware (express.static)
  if (fs.existsSync(filePath)) {
    return next();
  }
  
  // Se não existe localmente, tentar buscar do AlwaysData
  if (ALWAYSDATA_URL) {
    const alwaysdataImageUrl = `${ALWAYSDATA_URL}/imgs${req.path}`;
    
    // Fazer proxy da imagem do AlwaysData
    try {
      const url = new URL(alwaysdataImageUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const request = protocol.get(alwaysdataImageUrl, (proxyRes) => {
        if (proxyRes.statusCode === 200) {
          // Copiar headers
          res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          
          // Pipe da resposta
          proxyRes.pipe(res);
        } else {
          // Retornar 404 como imagem (não JSON)
          res.status(404).type('text/plain').send('Imagem não encontrada');
        }
      });
      
      request.on('error', (err) => {
        // Retornar 404 como imagem (não JSON)
        if (!res.headersSent) {
          res.status(404).type('text/plain').send('Erro ao buscar imagem');
        }
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        // Retornar 504 como imagem (não JSON)
        if (!res.headersSent) {
          res.status(504).type('text/plain').send('Timeout ao buscar imagem');
        }
      });
      
      return; // Não chamar next() pois já estamos respondendo
    } catch (urlError) {
      next(); // Passar para o próximo middleware se houver erro na URL
    }
  }
  
  // Se não tem URL do AlwaysData configurada, passar para o próximo middleware
  // que vai retornar 404
  next();
});

// Rota específica para imagens (só será chamada se a imagem existir localmente)
app.use('/imgs', express.static(imgsPath, {
  maxAge: '1y', // Cache de 1 ano para imagens
  etag: true
}));

// Arquivos estáticos gerais
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

