const express = require('express');
const router = express.Router();
const cardapioController = require('../controller/cardapioAdmController');

router.get('/mostrarCardapio', cardapioController.mostrarCardapio);

module.exports = router;
