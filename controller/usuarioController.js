const Usuario = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const SECRET_KEY = process.env.KEY;  

exports.login = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await Usuario.buscarPorEmail(email);

        if (!usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        if (!usuario.senha || usuario.senha.trim() === '') {
            return res.status(401).json({ error: 'Senha não cadastrada para este usuário' });
        }

        const senhaValida = await argon2.verify(usuario.senha, senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: usuario.idusuario, email: usuario.email, type: usuario.tipo },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ token, type: usuario.tipo });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};


exports.cadastro = async (req, res) => {
    const {  nome, email, senha, tipo } = req.body;
    try {
        await Usuario.cadastrar({ nome, email, senha, tipo });
        res.json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
};

// Logout - invalidar token (opcional, pois JWT é stateless)
exports.logout = async (req, res) => {
    try {
        // JWT é stateless, então tecnicamente não precisamos fazer nada no backend
        // O token será invalidado no frontend removendo do localStorage
        res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({ error: 'Erro ao fazer logout' });
    }
};

