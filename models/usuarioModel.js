const pool = require('../config/bd');
const argon2 = require('argon2');

class Usuario {
    static async buscarPorEmail(email) {
        const [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        return rows[0];
    }

    static async cadastrar({ cpf, nome, email, senha, tipo }) {
        const senhaHash = await argon2.hash(senha);
        await pool.query(
            'INSERT INTO Usuario (cpf, nome, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
            [cpf, nome, email, senhaHash, tipo || 'cliente']
        );
    }
}

module.exports = Usuario;