const express = require('express');
const router = express.Router();
const pool = require('./database'); // Conexão com o MySQL
const argon2 = require('argon2');    // Para criptografia segura das senhas
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'yBgkfEbhp7P5OMjhaTFtzE60OSW7tvPZJvUuX/2wpJs='; // Idealmente, armazene essa chave em variáveis de ambiente

// ====================
// Rota de Login
// ====================
router.post('/login', async (req, res) => {
    // Extrai email e senha enviados no corpo da requisição
    const { email, senha } = req.body;

    try {
        // Primeiro, tenta encontrar o usuário na tabela "Usuario"
        let [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        let user = rows[0];
        // Define o tipo padrão como "cliente"
        let userType = 'cliente';

        // Se o usuário não for encontrado na tabela "Usuario", busca na tabela "Funcionario"
        if (!user) {
            [rows] = await pool.query('SELECT * FROM Funcionario WHERE email = ?', [email]);
            user = rows[0];
            // Se encontrar, usa o campo "tipo" do funcionário (ex.: "admin" ou "funcionario")
            userType = user ? user.tipo : null;
        }

        // Se o usuário não for encontrado em nenhuma das tabelas, retorna erro de credenciais
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verifica a senha usando Argon2 para comparar o hash armazenado com a senha fornecida
        const senhaValida = await argon2.verify(user.senha, senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gera um token JWT contendo os dados do usuário, com validade de 1 hora
        const token = jwt.sign(
            { id: user.cpf || user.id, email: user.email, type: userType },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Retorna o token e o tipo do usuário
        res.json({ token, type: userType });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// ====================
// Rota de Cadastro
// ====================
router.post('/cadastro', async (req, res) => {
    // Extrai os dados enviados no corpo da requisição
    const { cpf, nome, email, senha, tipo } = req.body;

    try {
        // Verifica se já existe um usuário com o mesmo CPF ou email na tabela "Usuario"
        const [existingUser] = await pool.query(
            'SELECT * FROM Usuario WHERE cpf = ? OR email = ?',
            [cpf, email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'CPF ou e-mail já cadastrado' });
        }

        // Cria o hash da senha usando Argon2 (modo argon2id para maior segurança)
        const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });

        // Insere o novo usuário na tabela "Usuario"
        await pool.query(
            'INSERT INTO Usuario (cpf, nome, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
            [cpf, nome, email, senhaHash, tipo || 'cliente']
        );

        // Retorna mensagem de sucesso no cadastro
        res.json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// ====================
// Rotas de Produtos (Cardápio)
// ====================

// Rota para buscar todos os produtos com suas categorias e URL de imagem
router.get('/produtos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.idproduto, p.nome, p.descricao, p.preco, p.imagem, c.nome AS categoria
            FROM Produto p
            JOIN Categoria c ON p.idcategoria = c.idcategoria
        `);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// Rota para adicionar um novo produto
router.post('/produtos', async (req, res) => {
    const { nome, descricao, preco, idcategoria, imagem } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO Produto (nome, descricao, preco, idcategoria, imagem) VALUES (?, ?, ?, ?, ?)',
            [nome, descricao, preco, idcategoria, imagem]
        );
        res.status(201).json({ id: result.insertId, nome, descricao, preco, idcategoria, imagem });
    } catch (err) {
        console.error('Erro ao adicionar produto:', err);
        res.status(500).json({ error: 'Erro ao adicionar produto' });
    }
});

// Rota para buscar um produto por ID
router.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM Produto WHERE idproduto = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar produto:', err);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// Rota para atualizar um produto
router.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, idcategoria, imagem } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE Produto SET nome = ?, descricao = ?, preco = ?, idcategoria = ?, imagem = ? WHERE idproduto = ?',
            [nome, descricao, preco, idcategoria, imagem, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ id, nome, descricao, preco, idcategoria, imagem });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Rota para deletar um produto
router.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM Produto WHERE idproduto = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

module.exports = router;
