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
        return res.redirect('/login_cadastro.html');
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.redirect('/login_cadastro.html');
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
    authSession,
    authAdmin
};
