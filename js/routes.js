const express = require('express');
const router = express.Router();
const pool = require('./database'); // Importa a conexão com o PostgreSQL

// Rota para buscar todos os produtos
router.get('/produtos', async (req, res) => {
    try {
        const query = `
            SELECT p.idproduto, p.nome, p.descricao, p.preco, c.nome AS categoria
            FROM Produto p
            JOIN Categoria c ON p.idcategoria = c.idcategoria
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// Rota para adicionar um produto
router.post('/produtos', async (req, res) => {
    const { nome, descricao, preco, idcategoria } = req.body;
    try {
        const query = `
            INSERT INTO Produto (nome, descricao, preco, idcategoria)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [nome, descricao, preco, idcategoria]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar produto' });
    }
});

// Rota para buscar um produto por ID
router.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM Produto WHERE idproduto = $1';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// Rota para atualizar um produto
router.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, idcategoria } = req.body;
    try {
        const query = `
            UPDATE Produto
            SET nome = $1, descricao = $2, preco = $3, idcategoria = $4
            WHERE idproduto = $5
            RETURNING *
        `;
        const { rows } = await pool.query(query, [nome, descricao, preco, idcategoria, id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Rota para deletar um produto
router.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM Produto WHERE idproduto = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

module.exports = router;