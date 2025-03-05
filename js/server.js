const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const secretKey = 'your_secret_key';

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'julio310705',
    database: 'JUlAOS_BURGER'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado ao banco de dados!');
});

// Rota para login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM Users WHERE email = ? AND password = ?'; // Assumindo uma tabela `Users`
    db.query(sql, [email, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            const token = jwt.sign({ email: user.email, type: user.type }, secretKey, { expiresIn: '1h' });
            res.json({ token, type: user.type }); // Inclui o tipo de usuário na resposta
        } else {
            res.status(401).send('Credenciais inválidas');
        }
    });
});

// Middleware para proteger rotas
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('Acesso negado');

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).send('Token inválido');
        req.user = user;
        next();
    });
}

// Rotas para categorias
app.get('/categorias', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM Categoria';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/categorias', authenticateToken, (req, res) => {
    const { nome } = req.body;
    const sql = 'INSERT INTO Categoria (nome) VALUES (?)';
    db.query(sql, [nome], (err, result) => {
        if (err) throw err;
        res.send('Categoria adicionada com sucesso!');
    });
});

app.put('/categorias/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    const sql = 'UPDATE Categoria SET nome = ? WHERE id = ?';
    db.query(sql, [nome, id], (err, result) => {
        if (err) throw err;
        res.send('Categoria atualizada com sucesso!');
    });
});

app.delete('/categorias/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Categoria WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.send('Categoria excluída com sucesso!');
    });
});

// Rotas para produtos
app.get('/produtos', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM Produto';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/produtos', authenticateToken, (req, res) => {
    const { nome, descricao, preco, id_categoria } = req.body;
    const sql = 'INSERT INTO Produto (nome, descricao, preco, id_categoria) VALUES (?, ?, ?, ?)';
    db.query(sql, [nome, descricao, preco, id_categoria], (err, result) => {
        if (err) throw err;
        res.send('Produto adicionado com sucesso!');
    });
});

app.put('/produtos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, id_categoria } = req.body;
    const sql = 'UPDATE Produto SET nome = ?, descricao = ?, preco = ?, id_categoria = ? WHERE id = ?';
    db.query(sql, [nome, descricao, preco, id_categoria, id], (err, result) => {
        if (err) throw err;
        res.send('Produto atualizado com sucesso!');
    });
});

app.delete('/produtos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Produto WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.send('Produto excluído com sucesso!');
    });
});

// Exemplo de rota protegida para funcionários
app.get('/admin/dashboard', authenticateToken, (req, res) => {
    if (req.user.type === 'employee') {
        res.send('Bem-vindo ao Painel Administrativo');
    } else {
        res.status(403).send('Acesso negado');
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
