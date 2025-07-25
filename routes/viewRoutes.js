const express = require('express');
const router = express.Router();
const path = require('path');


router.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/index.html'));
});

router.get('/sobre_nos', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/sobre_nos.html'));
});

router.get('/login_cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/login_cadastro.html'));
});


router.get('/conta', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/conta.html'));
});

router.get('/admin_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/admin_dashboard.html'));
});

router.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/cardapio.html'));
});

router.get('/pedidos', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pedidos.html'));
});


module.exports = router;