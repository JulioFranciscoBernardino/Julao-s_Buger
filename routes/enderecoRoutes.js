// ========================================
// ROTAS DE ENDEREÇOS
// Julão's Burger
// ========================================

const express = require('express');
const router = express.Router();
const enderecoController = require('../controller/enderecoController');
const { authJWT } = require('../middleware/auth');

// Listar todos os endereços do usuário
router.get('/', authJWT, enderecoController.listar);

// Buscar endereço principal
router.get('/principal', authJWT, enderecoController.buscarPrincipal);

// Buscar endereço por ID
router.get('/:id', authJWT, enderecoController.buscarPorId);

// Criar novo endereço
router.post('/', authJWT, enderecoController.criar);

// Atualizar endereço
router.put('/:id', authJWT, enderecoController.atualizar);

// Definir endereço como principal
router.patch('/:id/principal', authJWT, enderecoController.definirPrincipal);

// Excluir endereço
router.delete('/:id', authJWT, enderecoController.excluir);

module.exports = router;

