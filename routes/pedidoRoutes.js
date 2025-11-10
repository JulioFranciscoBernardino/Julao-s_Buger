const express = require('express');
const router = express.Router();
const PedidoController = require('../controller/pedidoController');
const { authJWT, authAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authJWT);

// Rotas dos pedidos
router.get('/admin', authAdmin, PedidoController.listarTodos); // Listar todos os pedidos (admin)
router.get('/', PedidoController.listar);                    // Listar pedidos do usuário
router.get('/:id', PedidoController.buscarPorId);            // Buscar pedido específico
router.post('/', PedidoController.criar);                    // Criar novo pedido
router.put('/:id/status', PedidoController.atualizarStatus); // Atualizar status do pedido
router.put('/:id/cancelar', PedidoController.cancelar);      // Cancelar pedido

module.exports = router;
