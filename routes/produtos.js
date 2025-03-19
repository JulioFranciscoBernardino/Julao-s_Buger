const express = require('express');
const router = express.Router();
const connection = require('../database'); // Conexão com o banco de dados

// Rota para buscar todos os produtos
router.get('/produtos', (req, res) => {
    const query = `
        SELECT p.idproduto, p.nome, p.descricao, p.preco, c.nome AS categoria
        FROM Produto p
        JOIN Categoria c ON p.idcategoria = c.idcategoria
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

module.exports = router;
