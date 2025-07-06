const express = require('express');
const router = express.Router();
const cardapioController = require('../controllers/cardapioAdmController');

router.get('/cardapio', cardapioController.mostrarCardapio);

module.exports = router;
