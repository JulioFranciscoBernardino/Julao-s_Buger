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


// Página sobre nós
router.get('/sobre_nos', (req, res) => {
    res.sendFile(path.join(__dirname, '../viewHTML/sobre_nos.html'));
});

// Página de login/cadastro
router.get('/login_cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../viewHTML/login_cadastro.html'));
});

// Página de conta
router.get('/conta', (req, res) => {
    res.sendFile(path.join(__dirname, '../viewHTML/conta.html'));
});

router.get('/admin_dashboard', (req, res) => {
    res.render('admin_dashboard'); 
});




module.exports = router;
