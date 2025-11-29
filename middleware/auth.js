const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.KEY || 'chave_jwt_fixa_para_teste';

// Middleware para verificar JWT
const authJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded; // Adiciona dados do usuário ao req
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido' });
    }
};

// Middleware para verificar JWT via query parameter (para páginas HTML)
const authJWTQuery = (req, res, next) => {
    const token = req.query.token;
    
    if (!token) {
        return res.redirect('/login_cadastro');
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.redirect('/login_cadastro');
    }
};

// Middleware para verificar JWT via query parameter ou header (para páginas HTML do retaguarda)
const authJWTAdminPage = (req, res, next) => {
    // Tentar obter token de várias fontes
    let token = null;
    
    // 1. Do header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    
    // 2. Do query parameter
    if (!token && req.query.token) {
        token = req.query.token;
    }
    
    if (!token) {
        return res.redirect('/login_cadastro?redirect=' + encodeURIComponent(req.originalUrl) + '&error=token_necessario');
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Verificar se é admin
        if (!decoded.type || !['admin', 'adm'].includes(decoded.type)) {
            return res.redirect('/login_cadastro?redirect=' + encodeURIComponent(req.originalUrl) + '&error=acesso_negado');
        }
        
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.redirect('/login_cadastro?redirect=' + encodeURIComponent(req.originalUrl) + '&error=token_invalido');
    }
};

// Middleware para verificar sessão (mantido para compatibilidade)
const authSession = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    next();
};

const authAdmin = (req, res, next) => {
    if (!req.usuario || !req.usuario.type || !['admin', 'adm'].includes(req.usuario.type)) {
        return res.status(403).json({ erro: 'Acesso restrito a administradores' });
    }
    next();
};

module.exports = {
    authJWT,
    authJWTQuery,
    authJWTAdminPage,
    authSession,
    authAdmin
};
