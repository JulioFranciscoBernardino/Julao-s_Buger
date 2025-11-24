const express = require('express');
const router = express.Router();

const CategoriaModel = require('../models/categoriaModel');
const ProdutoModel = require('../models/produtoModel');

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
        console.error('Erro ao carregar categorias e produtos');
        res.status(500).send('Erro ao carregar o cardápio');
    }
});




module.exports = router;
