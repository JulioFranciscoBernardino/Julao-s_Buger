const express = require('express');
const mysql = require('mysql2'); // Substituindo por mysql2
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const secretKey = 'your_secret_key';

// Configuração do banco de dados
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'julio310705',
    database: 'JULAOS_BURGER',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err);
        return;
    }
    console.log('Conectado ao banco de dados!');
    connection.release();
});

// Função para gerar hash da senha
async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

// Função para verificar senha
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Rota para login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM Usuario WHERE email = ?';
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor' });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = results[0];

        const passwordMatch = await comparePassword(password, user.senha);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ email: user.email, type: user.tipo }, secretKey, { expiresIn: '1h' });
        res.json({ token, type: user.tipo });
    });
});

// Middleware para autenticação
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Acesso negado' });

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// 🔹 Rotas para categorias
app.get('/categorias', authenticateToken, (req, res) => {
    db.query('SELECT * FROM Categoria', (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar categorias' });
        res.json(results);
    });
});

app.post('/categorias', authenticateToken, (req, res) => {
    const { nome } = req.body;
    db.query('INSERT INTO Categoria (nome) VALUES (?)', [nome], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar categoria' });
        res.json({ message: 'Categoria adicionada com sucesso!' });
    });
});

// 🔹 Rotas para produtos
app.get('/produtos', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.idproduto, p.nome, p.descricao, p.preco, c.nome AS categoria
        FROM Produto p
        JOIN Categoria c ON p.idcategoria = c.idcategoria
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar produtos' });
        res.json(results);
    });
});

app.post('/produtos', authenticateToken, (req, res) => {
    const { nome, descricao, preco, idcategoria } = req.body;
    db.query(
        'INSERT INTO Produto (nome, descricao, preco, idcategoria) VALUES (?, ?, ?, ?)',
        [nome, descricao, preco, idcategoria],
        (err) => {
            if (err) return res.status(500).json({ error: 'Erro ao adicionar produto' });
            res.json({ message: 'Produto adicionado com sucesso!' });
        }
    );
});

// 🔹 Rota de Admin
app.get('/admin/dashboard', authenticateToken, (req, res) => {
    if (req.user.type === 'funcionario') {
        res.json({ message: 'Bem-vindo ao Painel Administrativo' });
    } else {
        res.status(403).json({ error: 'Acesso negado' });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000 🚀');
});
