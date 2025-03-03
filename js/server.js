const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configuração do BD
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'julio310705',
    database: 'JUlAOS_BURGER'
});

// Conectar ao BD
db.connect(err => {
    if (err) throw err;
    console.log('Conectado ao banco de dados!');
});

// Listar categorias
app.get('/categorias', (req, res) => {
    const sql = 'SELECT * FROM Categoria';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Adicionar categoria
app.post('/categorias', (req, res) => {
    const { nome } = req.body;
    const sql = 'INSERT INTO Categoria (nome) VALUES (?)';
    db.query(sql, [nome], (err, result) => {
        if (err) throw err;
        res.send('Categoria adicionada com sucesso!');
    });
});

// Listar produtos
app.get('/produtos', (req, res) => {
    const sql = 'SELECT * FROM Produto';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Adicionar produto
app.post('/produtos', (req, res) => {
    const { nome, descricao, preco, id_categoria } = req.body;
    const sql = 'INSERT INTO Produto (nome, descricao, preco, id_categoria) VALUES (?, ?, ?, ?)';
    db.query(sql, [nome, descricao, preco, id_categoria], (err, result) => {
        if (err) throw err;
        res.send('Produto adicionado com sucesso!');
    });
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
