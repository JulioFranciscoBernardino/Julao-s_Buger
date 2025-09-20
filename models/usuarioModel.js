const pool = require('../config/bd');
const argon2 = require('argon2');

class Usuario {
    static async buscarPorEmail(email) {
        const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
        return rows[0];
    }

    static async cadastrar({ nome, email, senha, tipo }) {
        const senhaHash = await argon2.hash(senha);
        await pool.query(
            'INSERT INTO usuario ( nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            [ nome, email, senhaHash, tipo || 'admin' ]
        );
    }
}

module.exports = Usuario;