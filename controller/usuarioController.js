const Usuario = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const SECRET_KEY = process.env.KEY || 'chave_jwt_fixa_para_teste';  

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

// Buscar dados do perfil
exports.perfil = async (req, res) => {
    try {
        // Verificar se o usuário está autenticado (JWT ou sessão)
        let idusuario;
        
        if (req.usuario) {
            // JWT authentication
            idusuario = req.usuario.id;
        } else if (req.session && req.session.usuario) {
            // Session authentication
            idusuario = req.session.usuario.idusuario;
        } else {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }
        
        const usuario = await Usuario.buscarPorId(idusuario);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Remover senha antes de enviar
        delete usuario.senha;
        
        res.json(usuario);
        
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ erro: 'Erro ao buscar perfil' });
    }
};

// Atualizar dados do perfil
exports.atualizarPerfil = async (req, res) => {
    try {
        // Verificar se o usuário está autenticado
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }
        
        const idusuario = req.session.usuario.idusuario;
        const { nome } = req.body;
        
        if (!nome || nome.trim() === '') {
            return res.status(400).json({ erro: 'Nome é obrigatório' });
        }
        
        const atualizado = await Usuario.atualizarNome(idusuario, nome);
        
        if (!atualizado) {
            return res.status(400).json({ erro: 'Erro ao atualizar perfil' });
        }
        
        // Atualizar sessão
        req.session.usuario.nome = nome;
        
        // Buscar usuário atualizado
        const usuario = await Usuario.buscarPorId(idusuario);
        delete usuario.senha;
        
        res.json(usuario);
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ erro: 'Erro ao atualizar perfil' });
    }
};

// Alterar senha
exports.alterarSenha = async (req, res) => {
    try {
        // Verificar se o usuário está autenticado
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }
        
        const idusuario = req.session.usuario.idusuario;
        const { senhaAtual, novaSenha } = req.body;
        
        // Validações
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }
        
        if (novaSenha.length < 6) {
            return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres' });
        }
        
        // Buscar usuário
        const usuario = await Usuario.buscarPorId(idusuario);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Verificar senha atual
        const senhaValida = await argon2.verify(usuario.senha, senhaAtual);
        
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Senha atual incorreta' });
        }
        
        // Criptografar nova senha
        const novaSenhaHash = await argon2.hash(novaSenha);
        
        // Atualizar senha
        const atualizado = await Usuario.atualizarSenha(idusuario, novaSenhaHash);
        
        if (!atualizado) {
            return res.status(400).json({ erro: 'Erro ao alterar senha' });
        }
        
        res.json({ mensagem: 'Senha alterada com sucesso' });
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ erro: 'Erro ao alterar senha' });
    }
};

