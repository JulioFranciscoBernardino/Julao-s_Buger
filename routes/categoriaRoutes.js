const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.listarCategorias);
router.post('/inserir', categoriaController.inserirCategoria);

module.exports = router;
