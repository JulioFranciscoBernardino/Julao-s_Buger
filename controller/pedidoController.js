const db = require('../config/bd');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');

async function carregarItensDetalhados(pedidoId) {
    const itensQuery = `
        SELECT 
            pp.idpedidoproduto,
            pp.idproduto,
            pp.quantidade,
            pp.observacao,
            pr.nome,
            pr.preco
        FROM pedidoproduto pp
        JOIN produto pr ON pp.idproduto = pr.idproduto
        WHERE pp.idpedido = ?
    `;

    const [itens] = await db.execute(itensQuery, [pedidoId]);
    let totalItens = 0;

    const itensDetalhados = await Promise.all(
        itens.map(async (item) => {
            const opcionaisQuery = `
                SELECT 
                    ppo.idopcional,
                    ppo.quantidade,
                    o.nome,
                    o.preco
                FROM pedidoprodutoopcional ppo
                JOIN opcional o ON ppo.idopcional = o.idopcional
                WHERE ppo.idpedidoproduto = ?
            `;

            const [opcionais] = await db.execute(opcionaisQuery, [item.idpedidoproduto]);
            const precoProduto = parseFloat(item.preco || 0);
            const totalOpcionais = (opcionais || []).reduce((total, opcional) => {
                return total + (parseFloat(opcional.preco || 0) * (opcional.quantidade || 1));
            }, 0);
            const totalItem = (precoProduto * item.quantidade) + totalOpcionais;
            totalItens += totalItem;

            return {
                idpedidoproduto: item.idpedidoproduto,
                idproduto: item.idproduto,
                nome: item.nome,
                quantidade: item.quantidade,
                preco: precoProduto,
                observacao: item.observacao || null,
                opcionais: opcionais || [],
                totalItem
            };
        })
    );

    return { itensDetalhados, totalItens };
}

class PedidoController {
    // Listar pedidos do usuário
    static async listar(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Token inválido' });
            }

            const userId = req.usuario.id || req.usuario.idusuario;
            
            if (!userId) {
                return res.status(401).json({ erro: 'ID do usuário não encontrado' });
            }

            const query = `
                SELECT 
                    p.*,
                    u.nome AS nome_cliente,
                    u.telefone AS telefone_cliente,
                    e.logradouro, e.numero, e.bairro, e.cidade, e.estado, e.cep
                FROM pedido p
                LEFT JOIN usuario u ON p.idusuario = u.idusuario
                LEFT JOIN endereco e ON p.idendereco = e.idendereco
                WHERE p.idusuario = ? AND p.excluido = 0
                ORDER BY p.data_pedido DESC
                LIMIT 50
            `;
            
            const [pedidos] = await db.execute(query, [userId]);
            
            // Calcular total do pedido para cada pedido
            const pedidosComTotal = await Promise.all(
                pedidos.map(async (pedido) => {
                    try {
                        const { itensDetalhados, totalItens } = await carregarItensDetalhados(pedido.idpedido);
                        const totalFinal = totalItens + (parseFloat(pedido.valor_entrega) || 0);

                        return {
                            ...pedido,
                            totalPedido: totalFinal,
                            itens: itensDetalhados
                        };
                    } catch (error) {
                        console.error('Erro ao calcular total do pedido:', error);
                        return {
                            ...pedido,
                            totalPedido: pedido.valor_total || 0,
                            itens: []
                        };
                    }
                })
            );
            
            res.json(pedidosComTotal);
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    static async listarTodos(req, res) {
        try {
            if (!req.usuario || !['admin', 'adm'].includes(req.usuario.type)) {
                return res.status(403).json({ erro: 'Acesso restrito a administradores' });
            }

            const params = [];
            let whereClause = 'p.excluido = 0';

            // SEMPRE filtrar apenas pedidos do dia atual (sem exceções)
            // Pedidos de dias anteriores NÃO devem aparecer no gestor
            // Se houver parâmetro 'data' na query, usar essa data específica (para relatórios/histórico)
            if (req.query.data) {
                // Validar formato da data (YYYY-MM-DD)
                const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (dataRegex.test(req.query.data)) {
                    whereClause += ' AND DATE(p.data_pedido) = ?';
                    params.push(req.query.data);
                } else {
                    // Se a data for inválida, usar data atual
                    whereClause += ' AND DATE(p.data_pedido) = CURDATE()';
                }
            } else {
                // Por padrão: APENAS pedidos do dia atual
                // CURDATE() retorna a data atual do servidor MySQL (formato YYYY-MM-DD)
                whereClause += ' AND DATE(p.data_pedido) = CURDATE()';
            }

            if (req.query.status) {
                whereClause += ' AND p.status = ?';
                params.push(req.query.status);
            }

            const query = `
                SELECT 
                    p.idpedido,
                    p.idusuario,
                    p.data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.observacoes,
                    u.nome AS cliente_nome,
                    u.telefone AS cliente_telefone,
                    u.email AS cliente_email,
                    e.logradouro AS end_logradouro,
                    e.numero AS end_numero,
                    e.complemento AS end_complemento,
                    e.bairro AS end_bairro,
                    e.cidade AS end_cidade,
                    e.estado AS end_estado,
                    e.cep AS end_cep
                FROM pedido p
                LEFT JOIN usuario u ON p.idusuario = u.idusuario
                LEFT JOIN endereco e ON p.idendereco = e.idendereco
                WHERE ${whereClause}
                ORDER BY p.data_pedido DESC
                LIMIT 200
            `;

            const [pedidos] = await db.execute(query, params);

            const pedidosComDetalhes = await Promise.all(
                pedidos.map(async (pedido) => {
                    try {
                        const { itensDetalhados, totalItens } = await carregarItensDetalhados(pedido.idpedido);
                        const totalFinal = totalItens + (parseFloat(pedido.valor_entrega) || 0);

                        return {
                            idpedido: pedido.idpedido,
                            idusuario: pedido.idusuario,
                            data_pedido: pedido.data_pedido,
                            status: pedido.status,
                            valor_total: parseFloat(pedido.valor_total || 0),
                            valor_entrega: parseFloat(pedido.valor_entrega || 0),
                            observacoes: pedido.observacoes,
                            cliente: {
                                nome: pedido.cliente_nome || 'Cliente',
                                telefone: pedido.cliente_telefone || '',
                                email: pedido.cliente_email || ''
                            },
                            endereco: {
                                logradouro: pedido.end_logradouro || '',
                                numero: pedido.end_numero || '',
                                complemento: pedido.end_complemento || '',
                                bairro: pedido.end_bairro || '',
                                cidade: pedido.end_cidade || '',
                                estado: pedido.end_estado || '',
                                cep: pedido.end_cep || ''
                            },
                            itens: itensDetalhados,
                            totalPedido: totalFinal
                        };
                    } catch (error) {
                        console.error('Erro ao montar pedido (admin):', error);
                        return {
                            idpedido: pedido.idpedido,
                            idusuario: pedido.idusuario,
                            data_pedido: pedido.data_pedido,
                            status: pedido.status,
                            valor_total: parseFloat(pedido.valor_total || 0),
                            valor_entrega: parseFloat(pedido.valor_entrega || 0),
                            observacoes: pedido.observacoes,
                            cliente: {
                                nome: pedido.cliente_nome || 'Cliente',
                                telefone: pedido.cliente_telefone || '',
                                email: pedido.cliente_email || ''
                            },
                            endereco: {
                                logradouro: pedido.end_logradouro || '',
                                numero: pedido.end_numero || '',
                                complemento: pedido.end_complemento || '',
                                bairro: pedido.end_bairro || '',
                                cidade: pedido.end_cidade || '',
                                estado: pedido.end_estado || '',
                                cep: pedido.end_cep || ''
                            },
                            itens: [],
                            totalPedido: parseFloat(pedido.valor_total || 0)
                        };
                    }
                })
            );

            res.json(pedidosComDetalhes);
        } catch (error) {
            console.error('Erro ao listar pedidos (admin):', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Buscar pedido por ID
    static async buscarPorId(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Token inválido' });
            }

            // Verificar se req.usuario.id existe, senão usar idusuario
            const userId = req.usuario.id || req.usuario.idusuario;
            if (!userId) {
                return res.status(401).json({ erro: 'ID do usuário não encontrado' });
            }

            const { id } = req.params;

            const pedidoQuery = `
                SELECT 
                    p.idpedido,
                    p.data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.observacoes
                FROM pedido p
                WHERE p.idpedido = ? AND p.idusuario = ? AND p.ativo = 1 AND p.excluido = 0
            `;

            const [pedidos] = await db.execute(pedidoQuery, [id, userId]);

            if (!pedidos || pedidos.length === 0) {
                return res.status(404).json({ erro: 'Pedido não encontrado' });
            }

            const pedido = pedidos[0];

            // Buscar itens do pedido
            const itensQuery = `
                SELECT 
                    pp.idpedidoproduto,
                    pp.quantidade,
                    pp.observacao,
                    pr.idproduto,
                    pr.nome,
                    pr.preco,
                    pr.imagem
                FROM pedidoproduto pp
                JOIN produto pr ON pp.idproduto = pr.idproduto
                WHERE pp.idpedido = ?
            `;
            
            const [itens] = await db.execute(itensQuery, [id]);

            // Buscar opcionais de cada item
            for (let item of itens) {
                const opcionaisQuery = `
                    SELECT 
                        o.idopcional,
                        o.nome,
                        o.preco,
                        ppo.quantidade
                    FROM pedidoprodutoopcional ppo
                    JOIN opcional o ON ppo.idopcional = o.idopcional
                    WHERE ppo.idpedidoproduto = ?
                `;
                
                const [opcionais] = await db.execute(opcionaisQuery, [item.idpedidoproduto]);
                item.opcionais = opcionais || [];
                item.observacao = item.observacao || null;
            }

            pedido.itens = itens;
            const totalItens = itens.reduce((total, item) => {
                const precoProduto = parseFloat(item.preco || 0);
                const totalOpcionais = (item.opcionais || []).reduce((subtotal, opcional) => {
                    return subtotal + (parseFloat(opcional.preco || 0) * (opcional.quantidade || 1));
                }, 0);
                return total + ((precoProduto * item.quantidade) + totalOpcionais);
            }, 0);
            pedido.total = totalItens + (parseFloat(pedido.valor_entrega) || 0);

            res.json(pedido);
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Criar novo pedido
    static async criar(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Token inválido' });
            }

            // Verificar se req.usuario.id existe, senão usar idusuario
            const userId = req.usuario.id || req.usuario.idusuario;
            if (!userId) {
                return res.status(401).json({ erro: 'ID do usuário não encontrado' });
            }

            const { itens, observacoes, idendereco, idforma_pagamento, valor_total, valor_entrega } = req.body;

            if (!itens || !Array.isArray(itens) || itens.length === 0) {
                return res.status(400).json({ erro: 'Pedido deve conter pelo menos um item' });
            }

            if (!idendereco) {
                return res.status(400).json({ erro: 'Endereço é obrigatório' });
            }

            if (!idforma_pagamento) {
                return res.status(400).json({ erro: 'Forma de pagamento é obrigatória' });
            }

            // Iniciar transação
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Criar pedido
                const pedidoQuery = `
                    INSERT INTO pedido (idusuario, idendereco, idforma_pagamento, status, valor_total, valor_entrega, observacoes) 
                    VALUES (?, ?, ?, 'pendente', ?, ?, ?)
                `;
                
                const [pedidoResult] = await connection.execute(pedidoQuery, [
                    userId,
                    idendereco,
                    idforma_pagamento,
                    valor_total || 0,
                    valor_entrega || 0,
                    observacoes || null
                ]);
                const pedidoId = pedidoResult.insertId;

                let totalPedido = 0;

                // Adicionar itens do pedido
                for (let item of itens) {
                    const { idproduto, quantidade, observacao = null, opcionais = [] } = item;

                    // Buscar preço do produto
                    const produtoQuery = `SELECT preco FROM produto WHERE idproduto = ? AND ativo = 1`;
                    const [produtos] = await connection.execute(produtoQuery, [idproduto]);

                    if (produtos.length === 0) {
                        throw new Error(`Produto ${idproduto} não encontrado`);
                    }

                    const precoProduto = parseFloat(produtos[0].preco);

                    // Adicionar produto ao pedido
                    const itemQuery = `
                        INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, observacao) 
                        VALUES (?, ?, ?, ?)
                    `;
                    
                    const [itemResult] = await connection.execute(itemQuery, [pedidoId, idproduto, quantidade, observacao]);
                    const pedidoProdutoId = itemResult.insertId;

                    let precoItem = precoProduto * quantidade;

                    // Adicionar opcionais
                    for (let opcional of opcionais) {
                        const opcionalId = opcional?.idopcional || opcional?.id;
                        if (!opcionalId) {
                            continue;
                        }
                        const qtdOpcional = opcional?.quantidade ?? 1;
                        
                        // Buscar preço do opcional
                        const opcionalQuery = `SELECT preco FROM opcional WHERE idopcional = ? AND ativo = 1`;
                        const [opcionais_db] = await connection.execute(opcionalQuery, [opcionalId]);

                        if (opcionais_db.length > 0) {
                            const precoOpcional = parseFloat(opcionais_db[0].preco);
                            precoItem += precoOpcional * qtdOpcional;

                            // Adicionar opcional ao item
                            const opcionalItemQuery = `
                                INSERT INTO pedidoprodutoopcional (idpedidoproduto, idopcional, quantidade) 
                                VALUES (?, ?, ?)
                            `;
                            
                            await connection.execute(opcionalItemQuery, [pedidoProdutoId, opcionalId, qtdOpcional]);
                        }
                    }

                    totalPedido += precoItem;
                }

                // Confirmar transação
                await connection.commit();
                connection.release();

                res.status(201).json({
                    mensagem: 'Pedido criado com sucesso',
                    pedidoId: pedidoId,
                    total: totalPedido
                });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }

        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Atualizar status do pedido
    static async atualizarStatus(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Token inválido' });
            }

            // Verificar se req.usuario.id existe, senão usar idusuario
            const userId = req.usuario.id || req.usuario.idusuario;
            if (!userId) {
                return res.status(401).json({ erro: 'ID do usuário não encontrado' });
            }

            const { id } = req.params;
            const { status } = req.body;

            const statusMap = {
                pendente: 'pendente',
                aceito: 'aceito',
                preparo: 'preparando',
                entrega: 'entregue',
                concluido: 'concluido'
            };

            const statusConvertido = statusMap[status] || status;

            const statusValidos = ['pendente', 'aceito', 'preparando', 'pronto', 'entregue', 'cancelado', 'concluido'];
            if (!statusValidos.includes(statusConvertido)) {
                return res.status(400).json({ erro: 'Status inválido' });
            }

            // Verificar se é admin - admin pode atualizar qualquer pedido
            const isAdmin = req.usuario.type === 'admin' || req.usuario.type === 'adm';
            
            let query;
            let params;
            
            // IMPORTANTE: Usar UPDATE com condição WHERE para garantir que só atualiza se o status for diferente
            // Isso evita duplicação quando a função é chamada duas vezes simultaneamente
            if (isAdmin) {
                if (statusConvertido === 'concluido') {
                    // Para status "concluido", só atualizar se o status atual NÃO for "concluido"
                    query = `
                        UPDATE pedido 
                        SET status = ? 
                        WHERE idpedido = ? AND ativo = 1 AND status != 'concluido'
                    `;
                } else {
                    query = `
                        UPDATE pedido 
                        SET status = ? 
                        WHERE idpedido = ? AND ativo = 1
                    `;
                }
                params = [statusConvertido, id];
            } else {
                if (statusConvertido === 'concluido') {
                    // Para status "concluido", só atualizar se o status atual NÃO for "concluido"
                    query = `
                        UPDATE pedido 
                        SET status = ? 
                        WHERE idpedido = ? AND idusuario = ? AND ativo = 1 AND status != 'concluido'
                    `;
                } else {
                    query = `
                        UPDATE pedido 
                        SET status = ? 
                        WHERE idpedido = ? AND idusuario = ? AND ativo = 1
                    `;
                }
                params = [statusConvertido, id, userId];
            }

            const [result] = await db.execute(query, params);

            if (result.affectedRows === 0) {
                // Se nenhuma linha foi afetada, verificar se o pedido existe e qual é o status atual
                const verificarQuery = `
                    SELECT status, idusuario 
                    FROM pedido 
                    WHERE idpedido = ? AND ativo = 1
                `;
                const [pedidoVerificado] = await db.execute(verificarQuery, [id]);
                
                if (pedidoVerificado.length === 0) {
                    // Pedido não existe
                    return res.status(404).json({ erro: 'Pedido não encontrado' });
                }
                
                const statusAtual = pedidoVerificado[0].status;
                
                // Se o pedido já está com o status desejado, retornar sucesso (não é um erro)
                if (statusAtual === statusConvertido) {
                    console.log(`[STATUS] Pedido ${id} já está com status "${statusConvertido}"`);
                    return res.json({ 
                        mensagem: `Pedido já está com status "${statusConvertido}"`,
                        statusAtual: statusAtual
                    });
                }
                
                // Se o status é diferente mas não foi atualizado, pode ser problema de permissão
                if (!isAdmin) {
                    const pedidoUserId = pedidoVerificado[0].idusuario;
                    if (pedidoUserId !== userId) {
                        return res.status(403).json({ erro: 'Você não tem permissão para atualizar este pedido' });
                    }
                }
                
                // Outro motivo (ex: tentando atualizar para "concluido" mas já está concluído)
                if (statusConvertido === 'concluido' && statusAtual === 'concluido') {
                    console.log('[FIDELIDADE] Pedido já estava concluído, ignorando atualização...');
                    return res.json({ 
                        mensagem: 'Pedido já está concluído',
                        statusAtual: statusAtual
                    });
                }
                
                return res.status(400).json({ 
                    erro: 'Não foi possível atualizar o status do pedido',
                    statusAtual: statusAtual
                });
            }

            // Se o pedido foi concluído E a atualização foi bem-sucedida, adicionar pontos
            // Como usamos "status != 'concluido'" no WHERE, sabemos que o status mudou de algo para "concluido"
            if (statusConvertido === 'concluido' && result.affectedRows > 0) {
                try {
                    // Buscar dados do pedido para calcular pontos
                    const pedidoQuery = `
                        SELECT idusuario 
                        FROM pedido 
                        WHERE idpedido = ?
                    `;
                    const [pedidos] = await db.execute(pedidoQuery, [id]);
                    
                    if (pedidos.length > 0) {
                        const pedidoUserId = pedidos[0].idusuario;
                        
                        // Calcular valor total a partir dos itens do pedido
                        const { totalItens } = await carregarItensDetalhados(id);
                        const valorTotal = totalItens || 0;
                        
                        if (valorTotal > 0 && pedidoUserId) {
                            // Calcular pontos: o valor total do pedido (arredondado para inteiro)
                            const pontosGanhos = Math.round(valorTotal);
                            
                            console.log(`[FIDELIDADE] Adicionando ${pontosGanhos} pontos para o usuário ${pedidoUserId} (valor total: R$ ${valorTotal.toFixed(2)})`);
                            
                            if (pontosGanhos > 0 && pontosGanhos !== null && pontosGanhos !== undefined && !isNaN(pontosGanhos)) {
                                const resultadoPontos = await Usuario.adicionarPontos(pedidoUserId, pontosGanhos);
                                
                                if (resultadoPontos) {
                                    console.log(`✓ [FIDELIDADE] Pontos adicionados com sucesso: ${pontosGanhos} pontos para o usuário ${pedidoUserId}`);
                                } else {
                                    console.error(`✗ [FIDELIDADE] Falha ao adicionar pontos: nenhuma linha afetada para o usuário ${pedidoUserId}`);
                                }
                            } else {
                                console.warn(`[FIDELIDADE] Pontos inválidos: ${pontosGanhos} (valor total: ${valorTotal})`);
                            }
                        }
                    }
                } catch (error) {
                    // Log do erro mas não falhar a atualização do status
                    console.error('[FIDELIDADE] Erro ao adicionar pontos:', error);
                }
            }

            res.json({ mensagem: 'Status atualizado com sucesso' });

        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Cancelar pedido
    static async cancelar(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Token inválido' });
            }

            // Verificar se req.usuario.id existe, senão usar idusuario
            const userId = req.usuario.id || req.usuario.idusuario;
            if (!userId) {
                return res.status(401).json({ erro: 'ID do usuário não encontrado' });
            }

            const { id } = req.params;

            const query = `
                UPDATE pedido 
                SET status = 'cancelado' 
                WHERE idpedido = ? AND idusuario = ? AND ativo = 1 AND status = 'pendente'
            `;

            const result = await db.execute(query, [id, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ erro: 'Pedido não encontrado ou não pode ser cancelado' });
            }

            res.json({ mensagem: 'Pedido cancelado com sucesso' });

        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}

module.exports = PedidoController;
