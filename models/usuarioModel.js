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

    static async adicionarPontos(idusuario, pontos) {
        // Garantir que pontos seja um número inteiro válido
        const pontosInt = parseInt(pontos, 10);
        
        if (isNaN(pontosInt) || pontosInt <= 0) {
            console.error(`Tentativa de adicionar pontos inválidos: ${pontos} para usuário ${idusuario}`);
            return false;
        }
        
        try {
            const [resultado] = await pool.query(
                'UPDATE usuario SET pontos = COALESCE(pontos, 0) + ? WHERE idusuario = ?',
                [pontosInt, idusuario]
            );
            
            console.log(`Query executada: UPDATE usuario SET pontos = COALESCE(pontos, 0) + ${pontosInt} WHERE idusuario = ${idusuario}`);
            console.log(`Linhas afetadas: ${resultado.affectedRows}`);
            
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('Erro na query de adicionar pontos:', error);
            throw error;
        }
    }

    static async buscarPontos(idusuario) {
        const [rows] = await pool.query(
            'SELECT pontos FROM usuario WHERE idusuario = ?',
            [idusuario]
        );
        return rows[0]?.pontos || 0;
    }
}

module.exports = Usuario;