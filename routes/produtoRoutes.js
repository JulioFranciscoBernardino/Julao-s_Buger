
const express = require('express');
const router = express.Router();
const produtoController = require('../controller/produtoController');
const multer = require('multer');
const path = require('path');

// Configuração do multer para salvar imagens em public/imgs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/imgs/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', produtoController.listarProdutos);
router.get('/:idproduto', produtoController.buscarProdutoPorId);
router.post('/inserir', upload.single('imagem'), produtoController.inserirProduto);
router.put('/atualizar/:idproduto', upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/deletar/:idproduto', produtoController.deleteProduto);

module.exports = router;
