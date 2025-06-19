const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

exports.login = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await Usuario.buscarPorEmail(email);
        if (!usuario || !(await argon2.verify(usuario.senha, senha))) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const token = jwt.sign({ id: usuario.cpf, email: usuario.email, type: usuario.tipo }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, type: usuario.tipo });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

exports.cadastro = async (req, res) => {
    const { cpf, nome, email, senha, tipo } = req.body;
    try {
        await Usuario.cadastrar({ cpf, nome, email, senha, tipo });
        res.json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
};
