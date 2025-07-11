const express = require('express');
const router = express.Router();
const produtoController = require('../controller/produtoController');

router.get('/', produtoController.listarProdutos);
router.get('/inserirProduto', produtoController.inserirProduto);

module.exports = router;
