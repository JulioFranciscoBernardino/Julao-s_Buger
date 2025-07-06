const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.listarCategorias);
router.get('/InsertCategoria', categoriaController.listarCategorias)

module.exports = router;
