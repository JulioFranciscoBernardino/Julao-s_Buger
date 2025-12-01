const db = require('../config/bd');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');
const argon2 = require('argon2');

// Função para obter a data atual em Brasília (UTC-3)
// O Node.js já está configurado com TZ=America/Sao_Paulo no app.js
function getDataAtualBrasilia() {
    const agora = new Date();
    
    // Como o Node.js está configurado com timezone de Brasília,
    // podemos usar os métodos locais diretamente
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
}

// Função auxiliar para executar query com retry em caso de erro de conexão
async function executarQueryComRetry(queryFn, maxTentativas = 3) {
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            return await queryFn();
        } catch (error) {
            // Se for erro de conexão e não for a última tentativa, tentar novamente
            if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ETIMEDOUT') && tentativa < maxTentativas) {
                console.warn(`[DB] Tentativa ${tentativa} falhou, tentando novamente... (${error.code})`);
                // Aguardar um pouco antes de tentar novamente (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, 100 * tentativa));
                continue;
            }
            // Se não for erro de conexão ou for a última tentativa, lançar o erro
            throw error;
        }
    }
}

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

    let itens;
    try {
        [itens] = await executarQueryComRetry(() => db.execute(itensQuery, [pedidoId]));
    } catch (error) {
        console.error(`[DB] Erro ao carregar itens do pedido ${pedidoId}:`, error);
        // Retornar estrutura vazia em caso de erro
        return { itensDetalhados: [], totalItens: 0 };
    }

    if (!itens || itens.length === 0) {
        return { itensDetalhados: [], totalItens: 0 };
    }

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

            let opcionais = [];
            try {
                [opcionais] = await executarQueryComRetry(() => db.execute(opcionaisQuery, [item.idpedidoproduto]));
            } catch (error) {
                console.error(`[DB] Erro ao carregar opcionais do item ${item.idpedidoproduto}:`, error);
                // Continuar sem opcionais em caso de erro
                opcionais = [];
            }

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
                    p.idpedido,
                    p.idusuario,
                    p.idendereco,
                    p.idforma_pagamento,
                    CONVERT_TZ(p.data_pedido, '+00:00', '-03:00') AS data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.distancia_km,
                    p.observacoes,
                    p.tipo_entrega,
                    p.ativo,
                    p.excluido,
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

    // Listar todos os pedidos (público - para testes - SEM autenticação)
    static async listarTodosPublico(req, res) {
        try {
            const params = [];
            let whereClause = 'p.excluido = 0';

            // SEMPRE filtrar apenas pedidos do dia atual (sem exceções)
            // Pedidos de dias anteriores NÃO devem aparecer no gestor
            // Se houver parâmetro 'data' na query, usar essa data específica (para relatórios/histórico)
            if (req.query.data) {
                // Validar formato da data (YYYY-MM-DD)
                const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (dataRegex.test(req.query.data)) {
                    // Converter timestamp de UTC para Brasília (-03:00) antes de comparar a data
                    // data_pedido está salvo em UTC, então convertemos para Brasília para comparar
                    whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                    params.push(req.query.data);
                } else {
                    // Se a data for inválida, usar data atual em Brasília
                    const dataBrasilia = getDataAtualBrasilia();
                    whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                    params.push(dataBrasilia);
                }
            } else {
                // Por padrão: APENAS pedidos do dia atual em Brasília (UTC-3)
                // Converter timestamp de UTC para Brasília (-03:00) antes de comparar a data
                // data_pedido está salvo em UTC, então convertemos para Brasília para comparar
                const dataBrasilia = getDataAtualBrasilia();
                whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                params.push(dataBrasilia);
            }

            if (req.query.status) {
                whereClause += ' AND p.status = ?';
                params.push(req.query.status);
            }

            const query = `
                SELECT 
                    p.idpedido,
                    p.idusuario,
                    CASE 
                        WHEN p.data_pedido IS NOT NULL 
                        THEN CONVERT_TZ(p.data_pedido, '+00:00', '-03:00')
                        ELSE NULL
                    END AS data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.distancia_km,
                    p.observacoes,
                    p.tipo_entrega,
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

            let pedidos;
            try {
                [pedidos] = await executarQueryComRetry(() => db.execute(query, params));
            } catch (error) {
                console.error('Erro ao listar pedidos (público):', error);
                return res.status(500).json({ erro: 'Erro ao conectar com o banco de dados. Tente novamente.' });
            }

            if (!pedidos || pedidos.length === 0) {
                return res.json([]);
            }

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
                            distancia_km: pedido.distancia_km ? Number(pedido.distancia_km) : null,
                            observacoes: pedido.observacoes,
                            tipo_entrega: pedido.tipo_entrega || 'entrega',
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
                        console.error(`Erro ao montar pedido ${pedido.idpedido} (público):`, error);
                        return {
                            idpedido: pedido.idpedido,
                            idusuario: pedido.idusuario,
                            data_pedido: pedido.data_pedido,
                            status: pedido.status,
                            valor_total: parseFloat(pedido.valor_total || 0),
                            valor_entrega: parseFloat(pedido.valor_entrega || 0),
                            distancia_km: pedido.distancia_km ? Number(pedido.distancia_km) : null,
                            observacoes: pedido.observacoes,
                            tipo_entrega: pedido.tipo_entrega || 'entrega',
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
            console.error('Erro ao listar pedidos (público):', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Listar todos os pedidos (com autenticação e verificação de admin)
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
                    // Converter timestamp de UTC para Brasília (-03:00) antes de comparar a data
                    // data_pedido está salvo em UTC, então convertemos para Brasília para comparar
                    whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                    params.push(req.query.data);
                } else {
                    // Se a data for inválida, usar data atual em Brasília
                    const dataBrasilia = getDataAtualBrasilia();
                    whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                    params.push(dataBrasilia);
                }
            } else {
                // Por padrão: APENAS pedidos do dia atual em Brasília (UTC-3)
                // Converter timestamp de UTC para Brasília (-03:00) antes de comparar a data
                // data_pedido está salvo em UTC, então convertemos para Brasília para comparar
                const dataBrasilia = getDataAtualBrasilia();
                whereClause += ' AND DATE(CONVERT_TZ(p.data_pedido, "+00:00", "-03:00")) = ?';
                params.push(dataBrasilia);
            }

            if (req.query.status) {
                whereClause += ' AND p.status = ?';
                params.push(req.query.status);
            }

            const query = `
                SELECT 
                    p.idpedido,
                    p.idusuario,
                    CASE 
                        WHEN p.data_pedido IS NOT NULL 
                        THEN CONVERT_TZ(p.data_pedido, '+00:00', '-03:00')
                        ELSE NULL
                    END AS data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.distancia_km,
                    p.observacoes,
                    p.tipo_entrega,
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

            let pedidos;
            try {
                [pedidos] = await executarQueryComRetry(() => db.execute(query, params));
            } catch (error) {
                console.error('Erro ao listar pedidos (admin):', error);
                return res.status(500).json({ erro: 'Erro ao conectar com o banco de dados. Tente novamente.' });
            }

            if (!pedidos || pedidos.length === 0) {
                return res.json([]);
            }

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
                            distancia_km: pedido.distancia_km ? Number(pedido.distancia_km) : null,
                            observacoes: pedido.observacoes,
                            tipo_entrega: pedido.tipo_entrega || 'entrega',
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
                        console.error(`Erro ao montar pedido ${pedido.idpedido} (admin):`, error);
                        return {
                            idpedido: pedido.idpedido,
                            idusuario: pedido.idusuario,
                            data_pedido: pedido.data_pedido,
                            status: pedido.status,
                            valor_total: parseFloat(pedido.valor_total || 0),
                            valor_entrega: parseFloat(pedido.valor_entrega || 0),
                            distancia_km: pedido.distancia_km ? Number(pedido.distancia_km) : null,
                            observacoes: pedido.observacoes,
                            tipo_entrega: pedido.tipo_entrega || 'entrega',
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

    // Buscar pedido por ID (público - para testes)
    static async buscarPorIdPublico(req, res) {
        try {
            const { id } = req.params;

            const pedidoQuery = `
                SELECT 
                    p.idpedido,
                    CONVERT_TZ(p.data_pedido, '+00:00', '-03:00') AS data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.distancia_km,
                    p.observacoes,
                    p.tipo_entrega,
                    u.nome AS nome_cliente,
                    u.telefone AS telefone_cliente,
                    e.logradouro,
                    e.numero,
                    e.complemento,
                    e.bairro,
                    e.cidade,
                    e.estado,
                    e.cep
                FROM pedido p
                LEFT JOIN usuario u ON p.idusuario = u.idusuario
                LEFT JOIN endereco e ON p.idendereco = e.idendereco
                WHERE p.idpedido = ? AND p.ativo = 1 AND p.excluido = 0
            `;

            const [pedidos] = await db.execute(pedidoQuery, [id]);

            if (!pedidos || pedidos.length === 0) {
                return res.status(404).json({ erro: 'Pedido não encontrado' });
            }

            const pedido = pedidos[0];
            pedido.distancia_km = pedido.distancia_km ? Number(pedido.distancia_km) : null;

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
            // Usar valor_total do banco de dados (já calculado corretamente considerando pontos)
            // Não recalcular, pois pode incluir produtos pagos com pontos que não devem entrar no total
            pedido.total = parseFloat(pedido.valor_total || 0);

            res.json(pedido);
        } catch (error) {
            console.error('Erro ao buscar pedido (público):', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Buscar pedido por ID (com autenticação)
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

            // Verificar se é admin - admin pode ver qualquer pedido
            const isAdmin = req.usuario.type === 'admin' || req.usuario.type === 'adm';

            const pedidoQuery = `
                SELECT 
                    p.idpedido,
                    CONVERT_TZ(p.data_pedido, '+00:00', '-03:00') AS data_pedido,
                    p.status,
                    p.valor_total,
                    p.valor_entrega,
                    p.distancia_km,
                    p.observacoes,
                    p.tipo_entrega,
                    u.nome AS nome_cliente,
                    u.telefone AS telefone_cliente,
                    e.logradouro,
                    e.numero,
                    e.complemento,
                    e.bairro,
                    e.cidade,
                    e.estado,
                    e.cep
                FROM pedido p
                LEFT JOIN usuario u ON p.idusuario = u.idusuario
                LEFT JOIN endereco e ON p.idendereco = e.idendereco
                WHERE p.idpedido = ? AND p.ativo = 1 AND p.excluido = 0 ${isAdmin ? '' : 'AND p.idusuario = ?'}
            `;

            const params = isAdmin ? [id] : [id, userId];
            const [pedidos] = await db.execute(pedidoQuery, params);

            if (!pedidos || pedidos.length === 0) {
                return res.status(404).json({ erro: 'Pedido não encontrado' });
            }

            const pedido = pedidos[0];
            pedido.distancia_km = pedido.distancia_km ? Number(pedido.distancia_km) : null;

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
            // Usar valor_total do banco de dados (já calculado corretamente considerando pontos)
            // Não recalcular, pois pode incluir produtos pagos com pontos que não devem entrar no total
            pedido.total = parseFloat(pedido.valor_total || 0);

            res.json(pedido);
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    // Criar novo pedido (com autenticação)
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

            const { itens, observacoes, idendereco, idforma_pagamento, valor_total, valor_entrega, distancia_km, tipo_entrega, pagamento_pontos, pontos_usados } = req.body;

            if (!itens || !Array.isArray(itens) || itens.length === 0) {
                return res.status(400).json({ erro: 'Pedido deve conter pelo menos um item' });
            }

            // Endereço só é obrigatório se for entrega
            if (tipo_entrega !== 'retirada' && !idendereco) {
                return res.status(400).json({ erro: 'Endereço é obrigatório para entrega' });
            }

            // Se não estiver pagando com pontos, forma de pagamento é obrigatória
            if (!pagamento_pontos && !idforma_pagamento) {
                return res.status(400).json({ erro: 'Forma de pagamento é obrigatória' });
            }
            
            // Se estiver pagando com pontos, validar pontos
            if (pagamento_pontos) {
                if (!pontos_usados || pontos_usados <= 0) {
                    return res.status(400).json({ erro: 'Quantidade de pontos inválida' });
                }
                
                // Verificar se o usuário tem pontos suficientes
                const pontosDisponiveis = await Usuario.buscarPontos(userId);
                if (pontosDisponiveis < pontos_usados) {
                    return res.status(400).json({ erro: 'Pontos insuficientes para este pedido' });
                }
            }

            // Iniciar transação
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Criar pedido
                // Estratégia: Salvar sempre em UTC (timezone 00)
                // A conversão para horário de Brasília será feita apenas na leitura/consulta
                const pedidoQuery = `
                    INSERT INTO pedido (idusuario, idendereco, idforma_pagamento, status, valor_total, valor_entrega, distancia_km, observacoes, tipo_entrega, data_pedido) 
                    VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, UTC_TIMESTAMP())
                `;
                
                const tipoEntrega = tipo_entrega === 'retirada' ? 'retirada' : 'entrega';
                
                const [pedidoResult] = await connection.execute(pedidoQuery, [
                    userId,
                    idendereco || null, // Pode ser null se for retirada
                    idforma_pagamento || null, // Pode ser null se todos os produtos forem pagos com pontos
                    valor_total || 0,
                    valor_entrega || 0, // Taxa sempre cobrada
                    distancia_km || null,
                    observacoes || null,
                    tipoEntrega
                ]);
                const pedidoId = pedidoResult.insertId;

                let totalPedido = 0;
                let pontosNecessariosCalculados = 0;

                // Adicionar itens do pedido
                for (let item of itens) {
                    const { idproduto, quantidade, observacao = null, opcionais = [], pagar_com_pontos = false } = item;

                    // Buscar preço e preco_pontos do produto
                    const produtoQuery = `SELECT preco, preco_pontos FROM produto WHERE idproduto = ? AND ativo = 1`;
                    const [produtos] = await connection.execute(produtoQuery, [idproduto]);

                    if (produtos.length === 0) {
                        throw new Error(`Produto ${idproduto} não encontrado`);
                    }

                    const precoProduto = parseFloat(produtos[0].preco);
                    const precoPontosProduto = parseFloat(produtos[0].preco_pontos || 0);

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

                    // Se o item será pago com pontos, calcular pontos necessários
                    if (pagar_com_pontos && precoPontosProduto > 0) {
                        pontosNecessariosCalculados += precoPontosProduto * quantidade;
                    } else {
                        // Se não for pago com pontos, adicionar ao total em dinheiro
                        totalPedido += precoItem;
                    }
                }

                // Se estiver pagando com pontos, verificar novamente e descontar os pontos
                if (pagamento_pontos && pontos_usados > 0) {
                    // Validar se os pontos calculados batem com os enviados
                    if (pontosNecessariosCalculados !== pontos_usados && process.env.NODE_ENV === 'development') {
                        console.warn(`[PONTOS] Divergência: calculado=${pontosNecessariosCalculados}, enviado=${pontos_usados}`);
                    }
                    
                    // Verificar novamente dentro da transação (evitar condição de corrida)
                    const pontosDisponiveisTransacao = await Usuario.buscarPontos(userId, connection);
                    if (pontosDisponiveisTransacao < pontos_usados) {
                        await connection.rollback();
                        connection.release();
                        return res.status(400).json({ erro: 'Pontos insuficientes para este pedido' });
                    }
                    
                    // Passar a conexão da transação para usar a mesma conexão
                    const pontosDescontados = await Usuario.descontarPontos(userId, pontos_usados, connection);
                    if (!pontosDescontados) {
                        await connection.rollback();
                        connection.release();
                        return res.status(400).json({ erro: 'Erro ao descontar pontos. Verifique se você tem pontos suficientes.' });
                    }
                }

                // Calcular valor total final (produtos em dinheiro + taxa de entrega)
                const valorTotalFinal = totalPedido + (valor_entrega || 0);
                
                // Atualizar o valor_total do pedido com o valor calculado corretamente
                await connection.execute(
                    'UPDATE pedido SET valor_total = ? WHERE idpedido = ?',
                    [valorTotalFinal, pedidoId]
                );

                // Confirmar transação
                await connection.commit();
                connection.release();

                res.status(201).json({
                    mensagem: 'Pedido criado com sucesso',
                    pedidoId: pedidoId,
                    total: valorTotalFinal,
                    pontos_usados: pagamento_pontos ? pontos_usados : 0
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

    // Criar novo pedido sem autenticação (para clientes não logados)
    static async criarSemAutenticacao(req, res) {
        try {
            const { 
                itens, 
                observacoes, 
                idendereco, 
                idforma_pagamento, 
                valor_total, 
                valor_entrega, 
                distancia_km, 
                tipo_entrega,
                dadosCliente,
                enderecoCompleto,
                pagamento_pontos,
                pontos_usados
            } = req.body;

            // Validar dados do cliente (obrigatório quando não está logado)
            if (!dadosCliente || !dadosCliente.nome || !dadosCliente.telefone || !dadosCliente.email || !dadosCliente.senha) {
                return res.status(400).json({ erro: 'Dados do cliente são obrigatórios (nome, telefone, email e senha)' });
            }
            
            // Validar senha
            if (dadosCliente.senha.length < 6) {
                return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
            }

            if (!itens || !Array.isArray(itens) || itens.length === 0) {
                return res.status(400).json({ erro: 'Pedido deve conter pelo menos um item' });
            }

            // Verificar se há produtos que serão pagos com dinheiro (não com pontos)
            let temProdutosDinheiro = false;
            for (let item of itens) {
                if (!item.pagar_com_pontos) {
                    temProdutosDinheiro = true;
                    break;
                }
            }

            // Se houver produtos em dinheiro, forma de pagamento é obrigatória
            if (temProdutosDinheiro && !idforma_pagamento) {
                return res.status(400).json({ erro: 'Forma de pagamento é obrigatória para produtos em dinheiro' });
            }
            
            // Se estiver pagando com pontos, validar pontos
            if (pagamento_pontos) {
                if (!pontos_usados || pontos_usados <= 0) {
                    return res.status(400).json({ erro: 'Quantidade de pontos inválida' });
                }
            }
            
            // Verificar se já existe usuário com esse email (antes de iniciar transação)
            const [usuarioExistente] = await db.execute(
                'SELECT idusuario FROM usuario WHERE email = ? LIMIT 1',
                [dadosCliente.email]
            );
            
            if (usuarioExistente.length > 0) {
                return res.status(400).json({ erro: 'Já existe uma conta com este e-mail. Por favor, faça login para continuar.' });
            }

            // Iniciar transação
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // SEMPRE criar um novo usuário para pedidos sem autenticação
                // Isso evita associar pedidos a usuários existentes incorretamente
                // Criar hash da senha
                const senhaHash = await argon2.hash(dadosCliente.senha);
                
                const [usuarioResult] = await connection.execute(
                    `INSERT INTO usuario (nome, telefone, email, tipo, senha) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        dadosCliente.nome,
                        dadosCliente.telefone.replace(/\D/g, ''),
                        dadosCliente.email || null,
                        'cliente',
                        senhaHash
                    ]
                );
                const userId = usuarioResult.insertId;
                
                let enderecoId = null;

                // Se for retirada, enderecoId deve ser null
                if (tipo_entrega === 'retirada') {
                    enderecoId = null;
                } else {
                    // Para entrega, verificar se tem idendereco ou enderecoCompleto
                    if (idendereco) {
                        // Verificar se o endereço existe e pertence ao usuário (ou é válido)
                        const [enderecoExistente] = await connection.execute(
                            'SELECT idendereco FROM endereco WHERE idendereco = ? LIMIT 1',
                            [idendereco]
                        );
                        
                        if (enderecoExistente.length > 0) {
                            enderecoId = idendereco;
                        } else {
                            // idendereco fornecido não existe, criar novo se tiver enderecoCompleto
                            if (enderecoCompleto) {
                                const [enderecoResult] = await connection.execute(
                                    `INSERT INTO endereco (idusuario, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                                    [
                                        userId,
                                        enderecoCompleto.nome || 'Endereço de Entrega',
                                        enderecoCompleto.cep ? enderecoCompleto.cep.replace(/\D/g, '') : null,
                                        enderecoCompleto.logradouro,
                                        enderecoCompleto.numero,
                                        enderecoCompleto.complemento || null,
                                        enderecoCompleto.bairro,
                                        enderecoCompleto.cidade,
                                        enderecoCompleto.estado
                                    ]
                                );
                                enderecoId = enderecoResult.insertId;
                            } else {
                                throw new Error('Endereço inválido ou não fornecido');
                            }
                        }
                    } else if (enderecoCompleto) {
                        // Criar endereço temporário
                        const [enderecoResult] = await connection.execute(
                            `INSERT INTO endereco (idusuario, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                            [
                                userId,
                                enderecoCompleto.nome || 'Endereço de Entrega',
                                enderecoCompleto.cep ? enderecoCompleto.cep.replace(/\D/g, '') : null,
                                enderecoCompleto.logradouro,
                                enderecoCompleto.numero,
                                enderecoCompleto.complemento || null,
                                enderecoCompleto.bairro,
                                enderecoCompleto.cidade,
                                enderecoCompleto.estado
                            ]
                        );
                        enderecoId = enderecoResult.insertId;
                    } else {
                        // Se for entrega mas não tiver endereço, retornar erro
                        throw new Error('Endereço é obrigatório para entrega');
                    }
                }

                // Criar pedido
                const pedidoQuery = `
                    INSERT INTO pedido (idusuario, idendereco, idforma_pagamento, status, valor_total, valor_entrega, distancia_km, observacoes, tipo_entrega, data_pedido) 
                    VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, UTC_TIMESTAMP())
                `;
                
                const tipoEntrega = tipo_entrega === 'retirada' ? 'retirada' : 'entrega';
                
                const [pedidoResult] = await connection.execute(pedidoQuery, [
                    userId,
                    enderecoId,
                    idforma_pagamento || null, // Pode ser null se todos os produtos forem pagos com pontos
                    valor_total || 0,
                    valor_entrega || 0, // Taxa sempre cobrada
                    distancia_km || null,
                    observacoes || null,
                    tipoEntrega
                ]);
                const pedidoId = pedidoResult.insertId;

                let totalPedido = 0;
                let pontosNecessariosCalculados = 0;

                // Adicionar itens do pedido
                for (let item of itens) {
                    const { idproduto, quantidade, observacao = null, opcionais = [], pagar_com_pontos = false } = item;

                    // Buscar preço e preco_pontos do produto
                    const produtoQuery = `SELECT preco, preco_pontos FROM produto WHERE idproduto = ? AND ativo = 1`;
                    const [produtos] = await connection.execute(produtoQuery, [idproduto]);

                    if (produtos.length === 0) {
                        throw new Error(`Produto ${idproduto} não encontrado`);
                    }

                    const precoProduto = parseFloat(produtos[0].preco);
                    const precoPontosProduto = parseFloat(produtos[0].preco_pontos || 0);

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

                    // Se o item será pago com pontos, calcular pontos necessários
                    if (pagar_com_pontos && precoPontosProduto > 0) {
                        pontosNecessariosCalculados += precoPontosProduto * quantidade;
                    } else {
                        // Se não for pago com pontos, adicionar ao total em dinheiro
                        totalPedido += precoItem;
                    }
                }

                // Se estiver pagando com pontos, verificar se o usuário tem pontos suficientes e descontar
                if (pagamento_pontos && pontos_usados > 0) {
                    // Validar se os pontos calculados batem com os enviados
                    if (pontosNecessariosCalculados !== pontos_usados) {
                        // Log apenas em desenvolvimento - remover em produção se necessário
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(`[PONTOS] Divergência: calculado=${pontosNecessariosCalculados}, enviado=${pontos_usados}`);
                        }
                    }
                    
                    // Verificar se o usuário tem pontos suficientes (dentro da transação)
                    const pontosDisponiveis = await Usuario.buscarPontos(userId, connection);
                    if (pontosDisponiveis < pontos_usados) {
                        await connection.rollback();
                        connection.release();
                        return res.status(400).json({ erro: 'Pontos insuficientes para este pedido' });
                    }
                    
                    // Passar a conexão da transação para usar a mesma conexão
                    const pontosDescontados = await Usuario.descontarPontos(userId, pontos_usados, connection);
                    if (!pontosDescontados) {
                        await connection.rollback();
                        connection.release();
                        return res.status(400).json({ erro: 'Erro ao descontar pontos. Verifique se você tem pontos suficientes.' });
                    }
                }

                // Calcular valor total final (produtos em dinheiro + taxa de entrega)
                const valorTotalFinal = totalPedido + (valor_entrega || 0);
                
                // Atualizar o valor_total do pedido com o valor calculado corretamente
                await connection.execute(
                    'UPDATE pedido SET valor_total = ? WHERE idpedido = ?',
                    [valorTotalFinal, pedidoId]
                );

                // Confirmar transação
                await connection.commit();
                connection.release();

                res.status(201).json({
                    mensagem: 'Pedido criado com sucesso',
                    pedidoId: pedidoId,
                    total: valorTotalFinal,
                    pontos_usados: pagamento_pontos ? pontos_usados : 0
                });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }

        } catch (error) {
            console.error('Erro ao criar pedido sem autenticação:', error);
            res.status(500).json({ erro: error.message || 'Erro interno do servidor' });
        }
    }

    // Atualizar status do pedido (público - para testes)
    static async atualizarStatusPublico(req, res) {
        try {
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

            // Para testes: permitir atualização sem verificação de usuário
            const query = `
                UPDATE pedido 
                SET status = ? 
                WHERE idpedido = ? AND ativo = 1
            `;
            const params = [statusConvertido, id];

            const [result] = await db.execute(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ erro: 'Pedido não encontrado' });
            }

            res.json({ mensagem: 'Status atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
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
                            
                            if (pontosGanhos > 0 && pontosGanhos !== null && pontosGanhos !== undefined && !isNaN(pontosGanhos)) {
                                await Usuario.adicionarPontos(pedidoUserId, pontosGanhos);
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

    // Cancelar pedido (público - para testes)
    static async cancelarPublico(req, res) {
        try {
            const { id } = req.params;

            // Para testes: permitir cancelamento sem verificação de usuário
            const query = `UPDATE pedido SET status = 'cancelado' WHERE idpedido = ? AND ativo = 1 AND status != 'cancelado'`;
            const params = [id];

            const [result] = await db.execute(query, params);

            if (result.affectedRows === 0) {
                const [pedidoVerificado] = await db.execute(
                    `SELECT status FROM pedido WHERE idpedido = ? AND ativo = 1`,
                    [id]
                );
                
                if (pedidoVerificado.length === 0) {
                    return res.status(404).json({ erro: 'Pedido não encontrado' });
                }
                
                const statusAtual = pedidoVerificado[0].status;
                if (statusAtual === 'cancelado') {
                    return res.json({ mensagem: 'Pedido já está cancelado' });
                }
                
                return res.status(400).json({ erro: 'Pedido não pode ser cancelado', statusAtual });
            }

            res.json({ mensagem: 'Pedido cancelado com sucesso' });
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
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

            const isAdmin = req.usuario.type === 'admin' || req.usuario.type === 'adm';
            const query = isAdmin
                ? `UPDATE pedido SET status = 'cancelado' WHERE idpedido = ? AND ativo = 1 AND status != 'cancelado'`
                : `UPDATE pedido SET status = 'cancelado' WHERE idpedido = ? AND idusuario = ? AND ativo = 1 AND status = 'pendente'`;
            const params = isAdmin ? [id] : [id, userId];

            const [result] = await db.execute(query, params);

            if (result.affectedRows === 0) {
                const [pedidoVerificado] = await db.execute(
                    `SELECT status FROM pedido WHERE idpedido = ? AND ativo = 1`,
                    [id]
                );
                
                if (pedidoVerificado.length === 0) {
                    return res.status(404).json({ erro: 'Pedido não encontrado' });
                }
                
                const statusAtual = pedidoVerificado[0].status;
                if (statusAtual === 'cancelado') {
                    return res.json({ mensagem: 'Pedido já está cancelado' });
                }
                
                return res.status(400).json({ erro: 'Pedido não pode ser cancelado', statusAtual });
            }

            res.json({ mensagem: 'Pedido cancelado com sucesso' });

        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}

module.exports = PedidoController;
