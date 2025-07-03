const express = require('express');
const router = express.Router();
const cardapioController = require('../controllers/cardapioCategoriaController');

router.get('/cardapio', cardapioController.mostrarCardapio);

module.exports = router;
