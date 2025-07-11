const express = require('express');
const router = express.Router();
const categoriaController = require('../controller/categoriaController');

router.get('/', categoriaController.listarCategorias);
router.post('/inserir', categoriaController.inserirCategoria);

module.exports = router;
