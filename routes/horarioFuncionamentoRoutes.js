const express = require('express');
const router = express.Router();
const horarioFuncionamentoController = require('../controller/horarioFuncionamentoController');
const auth = require('../middleware/auth');

// Rotas públicas para consulta
router.get('/', horarioFuncionamentoController.listarHorarios);
router.get('/dia/:diaSemana', horarioFuncionamentoController.buscarHorarioPorDia);

// Rotas protegidas (requerem autenticação de admin)
router.post('/', auth.authJWT, auth.authAdmin, horarioFuncionamentoController.criarOuAtualizarHorario);
router.put('/todos', auth.authJWT, auth.authAdmin, horarioFuncionamentoController.atualizarTodosHorarios);
router.put('/:idhorario', auth.authJWT, auth.authAdmin, horarioFuncionamentoController.criarOuAtualizarHorario);
router.delete('/:idhorario', auth.authJWT, auth.authAdmin, horarioFuncionamentoController.deletarHorario);

module.exports = router;

