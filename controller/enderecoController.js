// ========================================
// CONTROLLER DE ENDEREÇOS
// Julão's Burger
// ========================================

const enderecoModel = require('../models/enderecoModel');

const enderecoController = {
    // Listar endereços do usuário
    async listar(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            
            const enderecos = await enderecoModel.buscarPorUsuario(idusuario);
            
            res.json(enderecos);
            
        } catch (error) {
            console.error('Erro ao listar endereços:', error);
            res.status(500).json({ erro: 'Erro ao listar endereços' });
        }
    },

    // Buscar endereço por ID
    async buscarPorId(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            const idendereco = parseInt(req.params.id);
            
            if (!idendereco) {
                return res.status(400).json({ erro: 'ID inválido' });
            }
            
            const endereco = await enderecoModel.buscarPorId(idendereco, idusuario);
            
            if (!endereco) {
                return res.status(404).json({ erro: 'Endereço não encontrado' });
            }
            
            res.json(endereco);
            
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            res.status(500).json({ erro: 'Erro ao buscar endereço' });
        }
    },

    // Buscar endereço principal
    async buscarPrincipal(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            
            const endereco = await enderecoModel.buscarPrincipal(idusuario);
            
            if (!endereco) {
                return res.status(404).json({ erro: 'Nenhum endereço principal cadastrado' });
            }
            
            res.json(endereco);
            
        } catch (error) {
            console.error('Erro ao buscar endereço principal:', error);
            res.status(500).json({ erro: 'Erro ao buscar endereço principal' });
        }
    },

    // Criar novo endereço
    async criar(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, referencia, principal } = req.body;
            
            // Validações
            if (!apelido || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
                return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
            }
            
            if (cep.length !== 8) {
                return res.status(400).json({ erro: 'CEP inválido' });
            }
            
            if (estado.length !== 2) {
                return res.status(400).json({ erro: 'Estado inválido' });
            }
            
            const dados = {
                idusuario,
                apelido,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                principal: principal || 0
            };
            
            const novoEndereco = await enderecoModel.criar(dados);
            
            res.status(201).json({
                mensagem: 'Endereço criado com sucesso',
                endereco: novoEndereco
            });
            
        } catch (error) {
            console.error('Erro ao criar endereço:', error);
            res.status(500).json({ erro: 'Erro ao criar endereço' });
        }
    },

    // Atualizar endereço
    async atualizar(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            const idendereco = parseInt(req.params.id);
            const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, referencia, principal } = req.body;
            
            if (!idendereco) {
                return res.status(400).json({ erro: 'ID inválido' });
            }
            
            // Validações
            if (!apelido || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
                return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
            }
            
            // Verificar se o endereço pertence ao usuário
            const enderecoExiste = await enderecoModel.buscarPorId(idendereco, idusuario);
            
            if (!enderecoExiste) {
                return res.status(404).json({ erro: 'Endereço não encontrado' });
            }
            
            const dados = {
                apelido,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                principal: principal || 0
            };
            
            const atualizado = await enderecoModel.atualizar(idendereco, idusuario, dados);
            
            if (!atualizado) {
                return res.status(400).json({ erro: 'Erro ao atualizar endereço' });
            }
            
            res.json({ mensagem: 'Endereço atualizado com sucesso' });
            
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            res.status(500).json({ erro: 'Erro ao atualizar endereço' });
        }
    },

    // Definir endereço como principal
    async definirPrincipal(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            const idendereco = parseInt(req.params.id);
            
            if (!idendereco) {
                return res.status(400).json({ erro: 'ID inválido' });
            }
            
            // Verificar se o endereço pertence ao usuário
            const enderecoExiste = await enderecoModel.buscarPorId(idendereco, idusuario);
            
            if (!enderecoExiste) {
                return res.status(404).json({ erro: 'Endereço não encontrado' });
            }
            
            const atualizado = await enderecoModel.definirPrincipal(idendereco, idusuario);
            
            if (!atualizado) {
                return res.status(400).json({ erro: 'Erro ao definir endereço principal' });
            }
            
            res.json({ mensagem: 'Endereço principal atualizado com sucesso' });
            
        } catch (error) {
            console.error('Erro ao definir endereço principal:', error);
            res.status(500).json({ erro: 'Erro ao definir endereço principal' });
        }
    },

    // Excluir endereço
    async excluir(req, res) {
        try {
            // Verificar se o usuário está autenticado via JWT
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            
            const idusuario = req.usuario.id;
            const idendereco = parseInt(req.params.id);
            
            if (!idendereco) {
                return res.status(400).json({ erro: 'ID inválido' });
            }
            
            // Verificar se o endereço pertence ao usuário
            const enderecoExiste = await enderecoModel.buscarPorId(idendereco, idusuario);
            
            if (!enderecoExiste) {
                return res.status(404).json({ erro: 'Endereço não encontrado' });
            }
            
            const excluido = await enderecoModel.excluir(idendereco, idusuario);
            
            if (!excluido) {
                return res.status(400).json({ erro: 'Erro ao excluir endereço' });
            }
            
            res.json({ mensagem: 'Endereço excluído com sucesso' });
            
        } catch (error) {
            console.error('Erro ao excluir endereço:', error);
            res.status(500).json({ erro: 'Erro ao excluir endereço' });
        }
    }
};

module.exports = enderecoController;

