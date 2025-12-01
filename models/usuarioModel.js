const pool = require('../config/bd');
const argon2 = require('argon2');

// Função auxiliar para executar query com retry em caso de erro de conexão
async function executarQueryComRetry(queryFn, maxTentativas = 3) {
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            return await queryFn();
        } catch (error) {
            // Se for erro de conexão e não for a última tentativa, tentar novamente
            if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ETIMEDOUT') && tentativa < maxTentativas) {
                console.warn(`[UsuarioModel] Tentativa ${tentativa} falhou, tentando novamente... (${error.code})`);
                // Aguardar um pouco antes de tentar novamente (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, 200 * tentativa));
                continue;
            }
            // Se não for erro de conexão ou for a última tentativa, lançar o erro
            throw error;
        }
    }
}

class Usuario {
    static async buscarPorEmail(email) {
        try {
            const [rows] = await executarQueryComRetry(() => 
                pool.query('SELECT * FROM usuario WHERE email = ?', [email])
            );
            return rows[0];
        } catch (error) {
            console.error('[UsuarioModel] Erro ao buscar usuário por email:', error);
            throw error;
        }
    }

    static async buscarPorId(idusuario) {
        try {
            const [rows] = await executarQueryComRetry(() => 
                pool.query('SELECT * FROM usuario WHERE idusuario = ?', [idusuario])
            );
            return rows[0];
        } catch (error) {
            console.error('[UsuarioModel] Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }

    static async cadastrar({ nome, email, senha, tipo, telefone }) {
        try {
            const senhaHash = await argon2.hash(senha);
            await executarQueryComRetry(() => 
                pool.query(
                    'INSERT INTO usuario ( nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)',
                    [ nome, email, senhaHash, tipo || 'cliente', telefone || null ]
                )
            );
        } catch (error) {
            console.error('[UsuarioModel] Erro ao cadastrar usuário:', error);
            throw error;
        }
    }

    static async atualizarTelefone(idusuario, telefone) {
        try {
            const [resultado] = await executarQueryComRetry(() => 
                pool.query(
                    'UPDATE usuario SET telefone = ? WHERE idusuario = ?',
                    [telefone, idusuario]
                )
            );
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('[UsuarioModel] Erro ao atualizar telefone:', error);
            throw error;
        }
    }

    static async atualizarNome(idusuario, nome) {
        try {
            const [resultado] = await executarQueryComRetry(() => 
                pool.query(
                    'UPDATE usuario SET nome = ? WHERE idusuario = ?',
                    [nome, idusuario]
                )
            );
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('[UsuarioModel] Erro ao atualizar nome:', error);
            throw error;
        }
    }

    static async atualizarSenha(idusuario, senhaHash) {
        try {
            const [resultado] = await executarQueryComRetry(() => 
                pool.query(
                    'UPDATE usuario SET senha = ? WHERE idusuario = ?',
                    [senhaHash, idusuario]
                )
            );
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('[UsuarioModel] Erro ao atualizar senha:', error);
            throw error;
        }
    }

    static async adicionarPontos(idusuario, pontos) {
        // Garantir que pontos seja um número inteiro válido
        const pontosInt = parseInt(pontos, 10);
        
        if (isNaN(pontosInt) || pontosInt <= 0) {
            console.error(`Tentativa de adicionar pontos inválidos: ${pontos} para usuário ${idusuario}`);
            return false;
        }
        
        try {
            const [resultado] = await executarQueryComRetry(() => 
                pool.query(
                    'UPDATE usuario SET pontos = COALESCE(pontos, 0) + ? WHERE idusuario = ?',
                    [pontosInt, idusuario]
                )
            );
            
            console.log(`Query executada: UPDATE usuario SET pontos = COALESCE(pontos, 0) + ${pontosInt} WHERE idusuario = ${idusuario}`);
            console.log(`Linhas afetadas: ${resultado.affectedRows}`);
            
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('[UsuarioModel] Erro na query de adicionar pontos:', error);
            throw error;
        }
    }

    static async buscarPontos(idusuario, connection = null) {
        try {
            // Se uma conexão foi fornecida (transação), usar ela diretamente
            if (connection) {
                const [rows] = await connection.execute(
                    'SELECT pontos FROM usuario WHERE idusuario = ?',
                    [idusuario]
                );
                return rows[0]?.pontos || 0;
            }
            
            // Caso contrário, usar o pool com retry
            const [rows] = await executarQueryComRetry(() => 
                pool.query(
                    'SELECT pontos FROM usuario WHERE idusuario = ?',
                    [idusuario]
                )
            );
            return rows[0]?.pontos || 0;
        } catch (error) {
            console.error('[UsuarioModel] Erro ao buscar pontos:', error);
            throw error;
        }
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