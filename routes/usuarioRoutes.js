const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');
const { authJWT, authSession } = require('../middleware/auth');

// Autenticação
router.post('/login', usuarioController.login);
router.post('/cadastro', usuarioController.cadastro);
router.post('/logout', usuarioController.logout);

// Perfil - aceita tanto JWT quanto sessão
router.get('/perfil', authJWT, usuarioController.perfil);
router.put('/perfil', authJWT, usuarioController.atualizarPerfil);
router.put('/alterar-senha', authJWT, usuarioController.alterarSenha);


module.exports = router;