const express = require('express');
const router = express.Router();
const path = require('path');


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

router.get('/cardapio', (req, res) => {
    res.render('cardapio'); 
});

router.get('/pedidos', (req, res) => {
    res.render('pedidos'); 
});




module.exports = router;