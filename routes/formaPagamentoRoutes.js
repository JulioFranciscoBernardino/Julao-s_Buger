const express = require('express');
const router = express.Router();
const FormaPagamentoController = require('../controller/formaPagamentoController');

// Listar todas as formas de pagamento (público)
router.get('/', FormaPagamentoController.listar);

// Buscar forma de pagamento por ID (público)
router.get('/:id', FormaPagamentoController.buscarPorId);

module.exports = router; 