const express = require('express');
const router = express.Router();
const PedidoController = require('../controller/pedidoController');
const { authJWT, authAdmin } = require('../middleware/auth');

// Rotas públicas (sem autenticação) - para testes
router.post('/publico', PedidoController.criarSemAutenticacao);
router.get('/publico/admin', PedidoController.listarTodosPublico); // Listar todos os pedidos sem autenticação (para testes)
router.get('/publico/:id', PedidoController.buscarPorIdPublico); // Buscar pedido por ID sem autenticação (para testes)
router.put('/publico/:id/status', PedidoController.atualizarStatusPublico); // Atualizar status sem autenticação (para testes)
router.put('/publico/:id/cancelar', PedidoController.cancelarPublico); // Cancelar pedido sem autenticação (para testes)

// Aplicar middleware de autenticação em todas as rotas abaixo
router.use(authJWT);

// Rotas dos pedidos
router.get('/admin', authAdmin, PedidoController.listarTodos); // Listar todos os pedidos (admin)
router.get('/', PedidoController.listar);                    // Listar pedidos do usuário
router.get('/:id', PedidoController.buscarPorId);            // Buscar pedido específico
router.post('/', PedidoController.criar);                    // Criar novo pedido
router.put('/:id/status', PedidoController.atualizarStatus); // Atualizar status do pedido
router.put('/:id/cancelar', PedidoController.cancelar);      // Cancelar pedido

module.exports = router;
