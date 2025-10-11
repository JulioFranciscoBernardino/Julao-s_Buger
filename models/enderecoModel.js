// ========================================
// MODEL DE ENDEREÇO
// Julão's Burger
// ========================================

const db = require('../config/bd');

const enderecoModel = {
    // Criar novo endereço
    async criar(dados) {
        try {
            const connection = await db.getConnection();
            
            await connection.beginTransaction();
            
            try {
                // Se for endereço principal, remover principal de outros
                if (dados.principal) {
                    await connection.query(
                        'UPDATE endereco SET principal = 0 WHERE idusuario = ?',
                        [dados.idusuario]
                    );
                }
                
                // Inserir novo endereço
                const [resultado] = await connection.query(
                    `INSERT INTO endereco 
                    (idusuario, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, referencia, principal) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        dados.idusuario,
                        dados.apelido,
                        dados.cep,
                        dados.logradouro,
                        dados.numero,
                        dados.complemento || null,
                        dados.bairro,
                        dados.cidade,
                        dados.estado,
                        dados.referencia || null,
                        dados.principal || 0
                    ]
                );
                
                await connection.commit();
                
                return {
                    idendereco: resultado.insertId,
                    ...dados
                };
                
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro ao criar endereço:', error);
            throw error;
        }
    },

    // Buscar todos os endereços do usuário
    async buscarPorUsuario(idusuario) {
        try {
            const [enderecos] = await db.query(
                `SELECT * FROM endereco 
                 WHERE idusuario = ? AND excluido = 0 
                 ORDER BY principal DESC, data_criacao DESC`,
                [idusuario]
            );
            
            return enderecos;
        } catch (error) {
            console.error('Erro ao buscar endereços:', error);
            throw error;
        }
    },

    // Buscar endereço por ID
    async buscarPorId(idendereco, idusuario) {
        try {
            const [enderecos] = await db.query(
                'SELECT * FROM endereco WHERE idendereco = ? AND idusuario = ? AND excluido = 0',
                [idendereco, idusuario]
            );
            
            return enderecos[0] || null;
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            throw error;
        }
    },

    // Buscar endereço principal do usuário
    async buscarPrincipal(idusuario) {
        try {
            const [enderecos] = await db.query(
                'SELECT * FROM endereco WHERE idusuario = ? AND principal = 1 AND excluido = 0',
                [idusuario]
            );
            
            return enderecos[0] || null;
        } catch (error) {
            console.error('Erro ao buscar endereço principal:', error);
            throw error;
        }
    },

    // Atualizar endereço
    async atualizar(idendereco, idusuario, dados) {
        try {
            const connection = await db.getConnection();
            
            await connection.beginTransaction();
            
            try {
                // Se for endereço principal, remover principal de outros
                if (dados.principal) {
                    await connection.query(
                        'UPDATE endereco SET principal = 0 WHERE idusuario = ? AND idendereco != ?',
                        [idusuario, idendereco]
                    );
                }
                
                // Atualizar endereço
                const [resultado] = await connection.query(
                    `UPDATE endereco SET 
                        apelido = ?, 
                        cep = ?, 
                        logradouro = ?, 
                        numero = ?, 
                        complemento = ?, 
                        bairro = ?, 
                        cidade = ?, 
                        estado = ?, 
                        referencia = ?, 
                        principal = ?
                     WHERE idendereco = ? AND idusuario = ?`,
                    [
                        dados.apelido,
                        dados.cep,
                        dados.logradouro,
                        dados.numero,
                        dados.complemento || null,
                        dados.bairro,
                        dados.cidade,
                        dados.estado,
                        dados.referencia || null,
                        dados.principal || 0,
                        idendereco,
                        idusuario
                    ]
                );
                
                await connection.commit();
                
                return resultado.affectedRows > 0;
                
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            throw error;
        }
    },

    // Definir endereço como principal
    async definirPrincipal(idendereco, idusuario) {
        try {
            const connection = await db.getConnection();
            
            await connection.beginTransaction();
            
            try {
                // Remover principal de todos os endereços do usuário
                await connection.query(
                    'UPDATE endereco SET principal = 0 WHERE idusuario = ?',
                    [idusuario]
                );
                
                // Definir o endereço atual como principal
                const [resultado] = await connection.query(
                    'UPDATE endereco SET principal = 1 WHERE idendereco = ? AND idusuario = ?',
                    [idendereco, idusuario]
                );
                
                await connection.commit();
                
                return resultado.affectedRows > 0;
                
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Erro ao definir endereço principal:', error);
            throw error;
        }
    },

    // Excluir endereço (soft delete)
    async excluir(idendereco, idusuario) {
        try {
            const [resultado] = await db.query(
                'UPDATE endereco SET excluido = 1, ativo = 0 WHERE idendereco = ? AND idusuario = ?',
                [idendereco, idusuario]
            );
            
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir endereço:', error);
            throw error;
        }
    },

    // Excluir endereço permanentemente (hard delete)
    async excluirPermanente(idendereco, idusuario) {
        try {
            const [resultado] = await db.query(
                'DELETE FROM endereco WHERE idendereco = ? AND idusuario = ?',
                [idendereco, idusuario]
            );
            
            return resultado.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir endereço permanentemente:', error);
            throw error;
        }
    },

    // Contar endereços do usuário
    async contar(idusuario) {
        try {
            const [resultado] = await db.query(
                'SELECT COUNT(*) as total FROM endereco WHERE idusuario = ? AND excluido = 0',
                [idusuario]
            );
            
            return resultado[0].total;
        } catch (error) {
            console.error('Erro ao contar endereços:', error);
            throw error;
        }
    },

    // Verificar se endereço pertence ao usuário
    async pertenceAoUsuario(idendereco, idusuario) {
        try {
            const [resultado] = await db.query(
                'SELECT COUNT(*) as total FROM endereco WHERE idendereco = ? AND idusuario = ?',
                [idendereco, idusuario]
            );
            
            return resultado[0].total > 0;
        } catch (error) {
            console.error('Erro ao verificar endereço:', error);
            throw error;
        }
    }
};

module.exports = enderecoModel;

