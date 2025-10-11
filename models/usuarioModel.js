const pool = require('../config/bd');
const argon2 = require('argon2');

class Usuario {
    static async buscarPorEmail(email) {
        const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ?', [email]);
        return rows[0];
    }

    static async buscarPorId(idusuario) {
        const [rows] = await pool.query('SELECT * FROM usuario WHERE idusuario = ?', [idusuario]);
        return rows[0];
    }

    static async cadastrar({ nome, email, senha, tipo }) {
        const senhaHash = await argon2.hash(senha);
        await pool.query(
            'INSERT INTO usuario ( nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
            [ nome, email, senhaHash, tipo || 'admin' ]
        );
    }

    static async atualizarNome(idusuario, nome) {
        const [resultado] = await pool.query(
            'UPDATE usuario SET nome = ? WHERE idusuario = ?',
            [nome, idusuario]
        );
        return resultado.affectedRows > 0;
    }

    static async atualizarSenha(idusuario, senhaHash) {
        const [resultado] = await pool.query(
            'UPDATE usuario SET senha = ? WHERE idusuario = ?',
            [senhaHash, idusuario]
        );
        return resultado.affectedRows > 0;
    }
}

module.exports = Usuario;