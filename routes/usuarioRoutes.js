const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.post('/login', usuarioController.login);
router.post('/cadastro', usuarioController.cadastro);

module.exports = router;