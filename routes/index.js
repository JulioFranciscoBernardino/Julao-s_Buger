const express = require('express');
const router = express.Router();
const path = require('path');

// Importa os models
const CategoriaModel = require('../models/CategoriaModel');
const ProdutoModel = require('../models/ProdutoModel');

// Página inicial - cardápio
router.get('/', async (req, res) => {
    try {
        const categorias = await CategoriaModel.getAll(); 
        const produtos = await ProdutoModel.getAll();     

        res.render('index', {
            categorias,
            produtos
        });
    } catch (error) {
        console.error('Erro ao carregar categorias e produtos:', error);
        res.status(500).send('Erro ao carregar o cardápio');
    }
});




module.exports = router;
