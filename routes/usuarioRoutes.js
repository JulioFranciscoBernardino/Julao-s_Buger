const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');

router.post('/login', usuarioController.login);
router.post('/cadastro', usuarioController.cadastro);
router.post('/logout', usuarioController.logout);

module.exports = router;