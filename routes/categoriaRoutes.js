const express = require('express');
const router = express.Router();
const categoriaController = require('../controller/categoriaController');

router.get('/', categoriaController.listarCategorias);
router.post('/inserir', categoriaController.inserirCategoria);
router.delete('/deletar/:idcategoria', categoriaController.deletarCategoria);
router.put('/atualizar/:idcategoria', categoriaController.atualizarCategoria);

module.exports = router;
