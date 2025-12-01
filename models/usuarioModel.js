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

    static async cadastrar({ nome, email, senha, tipo, telefone }) {
        const senhaHash = await argon2.hash(senha);
        await pool.query(
            'INSERT INTO usuario ( nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)',
            [ nome, email, senhaHash, tipo || 'cliente', telefone || null ]
        );
    }

    static async atualizarTelefone(idusuario, telefone) {
        const [resultado] = await pool.query(
            'UPDATE usuario SET telefone = ? WHERE idusuario = ?',
            [telefone, idusuario]
        );
        return resultado.affectedRows > 0;
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

    static async buscarPontos(idusuario, connection = null) {
        const dbConnection = connection || pool;
        const [rows] = await dbConnection.query(
            'SELECT pontos FROM usuario WHERE idusuario = ?',
            [idusuario]
        );
        return rows[0]?.pontos || 0;
    }

    static async descontarPontos(idusuario, pontos, connection = null) {
        // Garantir que pontos seja um número inteiro válido
        const pontosInt = parseInt(pontos, 10);
        
        if (isNaN(pontosInt) || pontosInt <= 0) {
            console.error(`Tentativa de descontar pontos inválidos: ${pontos} para usuário ${idusuario}`);
            return false;
        }
        
        try {
            // Se uma conexão foi fornecida (transação), usar ela; senão usar o pool
            const queryMethod = connection ? connection.execute.bind(connection) : pool.query.bind(pool);
            
            // Verificar se o usuário tem pontos suficientes
            let pontosAtuais;
            if (connection) {
                const [rows] = await connection.execute(
                    'SELECT pontos FROM usuario WHERE idusuario = ?',
                    [idusuario]
                );
                pontosAtuais = rows[0]?.pontos || 0;
            } else {
                pontosAtuais = await this.buscarPontos(idusuario);
            }
            
            if (pontosAtuais < pontosInt) {
                console.error(`Usuário ${idusuario} não tem pontos suficientes. Atual: ${pontosAtuais}, Necessário: ${pontosInt}`);
                return false;
            }
            
            const [resultado] = await queryMethod(
                'UPDATE usuario SET pontos = pontos - ? WHERE idusuario = ? AND pontos >= ?',
                [pontosInt, idusuario, pontosInt]
            );
            
            if (resultado.affectedRows > 0) {
                console.log(`Pontos descontados: ${pontosInt} do usuário ${idusuario}`);
                return true;
            } else {
                console.error(`Falha ao descontar pontos: nenhuma linha afetada para o usuário ${idusuario}`);
                return false;
            }
        } catch (error) {
            console.error('Erro na query de descontar pontos:', error);
            throw error;
        }
    }
}

module.exports = Usuario;