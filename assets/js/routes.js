const express = require('express');
const router = express.Router();
const pool = require('./database'); // Conexão com MySQL
const argon2 = require('argon2');   // Para criptografia segura
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');   // Para hash da senha no cadastro
const cors = require('cors');      

const SECRET_KEY = 'yBgkfEbhp7P5OMjhaTFtzE60OSW7tvPZJvUuX/2wpJs='; 

router.use(cors());  // Agora está no lugar correto

// ====================
// Rota de Login
// ====================
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        let [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        let user = rows[0];
        let userType = 'cliente';

        if (!user) {
            [rows] = await pool.query('SELECT * FROM Funcionario WHERE email = ?', [email]);
            user = rows[0];
            userType = user ? user.tipo : null;
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const senhaValida = await argon2.verify(user.senha, senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.cpf || user.id, email: user.email, type: userType },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

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
    const { cpf, nome, email, senha, tipo } = req.body;

    try {
        console.log('📌 Dados recebidos para cadastro:', { cpf, nome, email, senha, tipo });

        const [existingUser] = await pool.query(
            'SELECT cpf, email FROM Usuario WHERE cpf = ? OR email = ?', 
            [cpf, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'CPF ou e-mail já cadastrado' });
        }

        const senhaHash = await argon2.hash(senha);  // Agora com Argon2 correto
        console.log('🔐 Senha após hash:', senhaHash);

        await pool.query(
            'INSERT INTO Usuario (cpf, nome, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
            [cpf, nome, email, senhaHash, tipo || 'cliente']
        );

        console.log('✅ Usuário cadastrado com sucesso:', { cpf, nome, email, tipo });
        res.json({ message: 'Usuário cadastrado com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// ====================
// Rotas de Produtos (Cardápio)
// ====================

// Buscar todos os produtos
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

// Adicionar um novo produto
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

// Buscar um produto por ID
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

// Atualizar um produto
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

// Deletar um produto
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

// Função para criptografar o CPF
function encryptCPF(cpf) {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'hAdlSTHH+juHQMrOzwSM4IYvzadEAQ7Ltvt+2UwwbZA='; // Defina uma chave secreta forte
    const iv = crypto.randomBytes(16); // Vetor de inicialização aleatório
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(cpf, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

// Função para descriptografar o CPF
function decryptCPF(encryptedCPF, iv) {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'hAdlSTHH+juHQMrOzwSM4IYvzadEAQ7Ltvt+2UwwbZA='; // A mesma chave usada para criptografar
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedCPF, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

// Função para verificar se o CPF é válido e não está cadastrado
const regexCPF = /^\d{11}$/; // Expressão regular para verificar o formato de CPF
async function isValidCPF(cpf) {
    if (!regexCPF.test(cpf)) {
        return { valid: false, message: 'CPF inválido. Deve ter 11 dígitos.' };
    }

    // Verifica se o CPF já está cadastrado no banco
    const query = 'SELECT * FROM Usuario WHERE cpf = ?';
    const [rows] = await pool.query(query, [cpf]);
    if (rows.length > 0) {
        return { valid: false, message: 'CPF já cadastrado.' };
    }
    return { valid: true };
}

// Função para validar a senha (mínimo 6 caracteres, 1 letra maiúscula, 1 número, 1 caractere especial)
function isValidPassword(password) {
    const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/;
    if (!regexPassword.test(password)) {
        return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres, uma letra maiúscula, um número e um caractere especial.' };
    }
    return { valid: true };
}

// Função para cadastro de usuário
async function cadastro(req, res) {
    const { cpf, nome, email, senha, tipo } = req.body;

    // Verificar e criptografar o CPF
    const { valid, message } = await isValidCPF(cpf);
    if (!valid) {
        return res.status(400).json({ error: message });
    }

    const { iv, encryptedData } = encryptCPF(cpf);

    // Verificar e validar a senha
    const passwordValidation = isValidPassword(senha);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    // Criptografar a senha com Argon2
    const senhaHash = await argon2.hash(senha);

    // Inserir no banco de dados
    try {
        await pool.query('INSERT INTO Usuario (cpf, nome, email, senha, tipo) VALUES (?, ?, ?, ?, ?)', [encryptedData, nome, email, senhaHash, tipo || 'cliente']);
        return res.status(200).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar usuário:', err);
        return res.status(500).json({ error: 'Erro ao realizar cadastro.' });
    }
}