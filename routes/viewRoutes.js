const express = require('express');
const router = express.Router();
const path = require('path');
const { authJWTQuery } = require('../middleware/auth');


router.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/index.html'));
});

router.get('/sobre_nos', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/sobre_nos.html'));
});

router.get('/login_cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/login_cadastro.html'));
});

router.get('/admin_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/admin_dashboard.html'));
});

router.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/cardapio.html'));
});

router.get('/pedidos', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/gestor_pedidos.html'));
});

router.get('/pedidos_cliente', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pedidos_cliente.html'));
});

router.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/checkout.html'));
});

// Rota protegida - deve ficar por último
router.get('/conta', authJWTQuery, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/conta.html'));
});

router.get('/horarios-funcionamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/horarios_funcionamento.html'));
});

router.get('/taxas-entrega', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/taxas_entrega.html'));
});

module.exports = router;