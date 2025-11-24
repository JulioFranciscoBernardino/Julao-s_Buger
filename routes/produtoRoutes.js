
const express = require('express');
const router = express.Router();
const produtoController = require('../controller/produtoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de upload existe (usando caminho absoluto)
// Este diretório será usado tanto localmente quanto no servidor AlwaysData
const uploadDir = path.join(__dirname, '..', 'public', 'imgs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para salvar imagens em public/imgs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Usar caminho absoluto para garantir que funcione no servidor
    // Garantir que o diretório existe antes de salvar
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Se foi fornecido um nome personalizado, usar ele
    if (req.body.nomeImagem) {
      const extensao = path.extname(file.originalname);
      const nomeArquivo = req.body.nomeImagem + extensao;
      cb(null, nomeArquivo);
    } else {
      // Senão, usar timestamp como antes
      const nomeArquivo = Date.now() + path.extname(file.originalname);
      cb(null, nomeArquivo);
    }
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Middleware para tratamento de erros de upload
const uploadMiddleware = (req, res, next) => {
  upload.single('imagem')(req, res, (err) => {
    if (err) {
      console.error('Erro no upload:', err.message);
      return res.status(400).json({ error: 'Erro ao fazer upload do arquivo' });
    }
    next();
  });
};

// Rota para verificar se uma imagem existe
router.get('/imagem-existe/:nomeArquivo', (req, res) => {
  const nomeArquivo = req.params.nomeArquivo;
  const caminhoImagem = path.join(uploadDir, nomeArquivo);
  
  if (fs.existsSync(caminhoImagem)) {
    res.json({ existe: true });
  } else {
    res.json({ existe: false });
  }
});

router.get('/', produtoController.listarProdutos);
router.get('/categoria/:idcategoria', produtoController.listarProdutosPorCategoria);
router.get('/:idproduto', produtoController.buscarProdutoPorId);
router.get('/:idproduto/opcionais', produtoController.buscarOpcionaisDoProduto);
router.get('/:idproduto/grupos-opcionais', produtoController.buscarGruposOpcionaisDoProduto);
router.post('/inserir', uploadMiddleware, produtoController.inserirProduto);
router.put('/atualizar/:idproduto', uploadMiddleware, produtoController.atualizarProduto);
router.put('/reordenar', produtoController.reordenarProdutos);
router.put('/disponibilidade/:idproduto', produtoController.atualizarDisponibilidade);
router.delete('/deletar/:idproduto', produtoController.deleteProduto);

module.exports = router;
