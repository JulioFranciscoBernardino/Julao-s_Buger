/**
 * Módulo de Impressão de Comandas
 * Responsável apenas pela geração e impressão de comandas de pedidos
 */

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let pedidos = [];
let pedidosAgrupadosPorStatus = {};
const statusOrdem = ['pendente', 'aceito', 'preparo', 'entrega', 'concluido'];
const statusLabels = {
    pendente: 'Pendente',
    aceito: 'Aceito',
    preparo: 'Em Preparo',
    entrega: 'Para Entrega',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
};
const SOM_PEDIDOS_ARQUIVO = '/sound/bell-2-123742.mp3';
let audioNovoPedido = null;
let ultimoTotalPendentes = 0;
let requisicaoAudioLiberada = false;

// ============================================
// FUNÇÕES AUXILIARES DE AUTENTICAÇÃO
// ============================================

function obterToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login_cadastro.html';
        return null;
    }
    return token;
}

function headersAutenticados(extraHeaders = {}) {
    const token = obterToken();
    if (!token) return null;
    return {
        ...extraHeaders,
        Authorization: `Bearer ${token}`
    };
}

// ============================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ============================================

function formatarDataHora(dataIso) {
    if (!dataIso) return { data: '-', hora: '-' };
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return { data: '-', hora: '-' };
    return {
        data: data.toLocaleDateString('pt-BR'),
        hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
}

function formatarPreco(valor) {
    const numero = parseFloat(valor ?? 0);
    if (Number.isNaN(numero)) return '0,00';
    return numero.toFixed(2).replace('.', ',');
}

function montarEnderecoPedido(pedido) {
    const enderecoObj = pedido.endereco || {};
    const logradouro = pedido.logradouro || enderecoObj.logradouro || '';
    const numero = pedido.numero || enderecoObj.numero || '';
    const bairro = pedido.bairro || enderecoObj.bairro || '';
    const cidade = pedido.cidade || enderecoObj.cidade || '';
    const estado = pedido.estado || enderecoObj.estado || '';
    const cep = pedido.cep || enderecoObj.cep || '';

    const partes = [
        logradouro,
        numero ? `, ${numero}` : '',
        bairro ? ` - ${bairro}` : '',
        cidade ? ` - ${cidade}` : '',
        estado ? `/${estado}` : ''
    ];
    const endereco = partes.join('').trim();
    const cepFormatado = cep ? ` CEP: ${cep}` : '';
    return (endereco || '-') + cepFormatado;
}

// ============================================
// GERAÇÃO DE HTML PARA IMPRESSÃO
// ============================================

function gerarHTMLComanda(pedido) {
    const { data, hora } = formatarDataHora(pedido.data_pedido || pedido.data);
    const numeroPedido = String(pedido.idpedido).padStart(3, '0');
    const nomeCliente = pedido.nome_cliente || pedido.cliente || 'Cliente';
    const telefone = pedido.telefone_cliente || pedido.telefone || '-';
    const endereco = pedido.endereco_formatado || montarEnderecoPedido(pedido);
    const total = formatarPreco(pedido.totalPedido ?? pedido.valor_total ?? pedido.total ?? 0);

    let html = '<div class="comanda-impressao">';

    html += '<div class="comanda-header">';
    html += '<div class="comanda-titulo">JULAO\'S BURGER</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';

    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">PEDIDO #' + numeroPedido + '</div>';
    html += '<div>Data: ' + data + ' ' + hora + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';

    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">CLIENTE:</div>';
    html += '<div>' + nomeCliente + '</div>';
    html += '<div>Tel: ' + telefone + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';

    html += '<div class="comanda-secao">';
    const tipoEntrega = pedido.tipo_entrega || 'entrega';
    if (tipoEntrega === 'retirada') {
        html += '<div class="comanda-secao-titulo">RETIRADA NO LOCAL</div>';
        html += '<div style="font-weight: 700; color: #e8b705;">Cliente retirará no estabelecimento</div>';
    } else {
        html += '<div class="comanda-secao-titulo">ENTREGA:</div>';
        html += '<div>' + endereco + '</div>';
    }
    html += '<div class="comanda-linha"></div>';
    html += '</div>';

    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">ITENS:</div>';

    const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : [];
    itensPedido.forEach((item, index) => {
        const nomeItem = item.nome || item.produto_nome || 'Produto';
        const quantidade = item.quantidade ?? item.qtd ?? 1;
        const precoItem = formatarPreco(item.preco || item.preco_unitario || 0);

        html += '<div class="comanda-item">';
        html += '<div class="comanda-item-numero">' + (index + 1) + '. ' + nomeItem + '</div>';
        html += '<div class="comanda-item-detalhes">Qtd: ' + quantidade + ' x R$ ' + precoItem + '</div>';

        if (Array.isArray(item.opcionais) && item.opcionais.length > 0) {
            html += '<div class="comanda-opcionais">Opcionais:</div>';
            item.opcionais.forEach(opcional => {
                const nomeOpcional = opcional.nome || '';
                const precoOpcional = opcional.preco > 0 ? ' (+R$ ' + formatarPreco(opcional.preco) + ')' : '';
                const qtdOpcional = opcional.quantidade > 1 ? ' x' + opcional.quantidade : '';
                html += '<div class="comanda-opcionais">- ' + nomeOpcional + qtdOpcional + precoOpcional + '</div>';
            });
        }

        if (item.observacao) {
            html += '<div class="comanda-observacao">Obs: ' + item.observacao + '</div>';
        }

        html += '</div>';
    });

    html += '<div class="comanda-linha"></div>';
    html += '</div>';

    html += '<div class="comanda-total">TOTAL: R$ ' + total + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '<div class="comanda-rodape">Obrigado pela preferência!</div>';
    html += '</div>';

    return html;
}

// ============================================
// FUNÇÕES DE IMPRESSÃO
// ============================================

async function buscarPedidoCompleto(pedidoId) {
    try {
        const headers = headersAutenticados();
        if (!headers) return null;

        const response = await fetch(`/api/pedidos/${pedidoId}`, { headers });
        if (!response.ok) {
            throw new Error('Erro ao buscar pedido');
        }

        const pedido = await response.json();
        return pedido;
    } catch (error) {
        console.error('Erro ao buscar pedido completo:', error);
        return null;
    }
}

async function imprimirComanda(pedido) {
    try {
        const htmlComanda = gerarHTMLComanda(pedido);
        const areaImpressao = document.getElementById('areaImpressao');
        if (!areaImpressao) {
            console.error('Área de impressão não encontrada');
            return false;
        }

        areaImpressao.innerHTML = htmlComanda;
        areaImpressao.style.display = 'block';

        await new Promise(resolve => setTimeout(resolve, 100));
        window.print();

        setTimeout(() => {
            areaImpressao.style.display = 'none';
            areaImpressao.innerHTML = '';
        }, 500);

        return true;
    } catch (error) {
        console.error('Erro ao imprimir comanda:', error);
        return false;
    }
}

async function imprimirComandaManual(pedidoId) {
    try {
        let pedidoParaImpressao = typeof pedidos !== 'undefined'
            ? pedidos.find(p => p.idpedido === pedidoId)
            : null;

        if (!pedidoParaImpressao || !pedidoParaImpressao.itens || pedidoParaImpressao.itens.length === 0) {
            pedidoParaImpressao = await buscarPedidoCompleto(pedidoId);
        }

        if (!pedidoParaImpressao) {
            showError('Não foi possível carregar os dados do pedido para impressão.');
            return;
        }

        const pedidoFormatado = {
            ...pedidoParaImpressao,
            idpedido: pedidoParaImpressao.idpedido || pedidoId,
            nome_cliente: pedidoParaImpressao.nome_cliente || pedidoParaImpressao.cliente?.nome || pedidoParaImpressao.cliente || 'Cliente',
            telefone_cliente: pedidoParaImpressao.telefone_cliente || pedidoParaImpressao.cliente?.telefone || pedidoParaImpressao.telefone || '',
            endereco_formatado: pedidoParaImpressao.endereco_formatado || montarEnderecoPedido(pedidoParaImpressao),
            data_pedido: pedidoParaImpressao.data_pedido || pedidoParaImpressao.data,
            totalPedido: pedidoParaImpressao.totalPedido || pedidoParaImpressao.total || pedidoParaImpressao.valor_total || 0,
            itens: pedidoParaImpressao.itens || []
        };

        await imprimirComanda(pedidoFormatado);
    } catch (error) {
        console.error('Erro ao imprimir comanda:', error);
        showError('Erro ao imprimir comanda. Tente novamente.');
    }
}

// Função para verificar se é admin
function isAdmin() {
    try {
        const token = obterToken();
        if (!token) return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.type === 'admin' || payload.type === 'adm';
    } catch (error) {
        return false;
    }
}

// Função para carregar pedidos
async function carregarPedidos() {
    try {
        const headers = headersAutenticados();
        if (!headers) {
            console.error('Headers não disponíveis');
            return false;
        }

        const url = isAdmin() ? '/api/pedidos/admin' : '/api/pedidos';
        const response = await fetch(url, { headers });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login_cadastro.html';
                return false;
            }
            throw new Error('Erro ao buscar pedidos');
        }

        const pedidosApi = await response.json();
        pedidos = Array.isArray(pedidosApi) ? pedidosApi : [];
        
        agruparPedidosPorStatus();
        renderizarColunas();
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        return false;
    }
}

function agruparPedidosPorStatus() {
    pedidosAgrupadosPorStatus = {
        pendente: [],
        aceito: [],
        preparo: [],
        entrega: [],
        concluido: []
    };

    pedidos.forEach(pedido => {
        const status = (pedido.status || '').toLowerCase();
        if (pedidosAgrupadosPorStatus[status]) {
            pedidosAgrupadosPorStatus[status].push(pedido);
        }
    });
}

function renderizarColunas() {
    statusOrdem.forEach(status => {
        const container = document.getElementById(`pedidos-${status}`);
        const countElement = document.getElementById(`count-${status}`);

        if (!container) return;
        container.innerHTML = '';

        const lista = pedidosAgrupadosPorStatus[status] || [];
        if (countElement) {
            countElement.textContent = lista.length;
        }

        if (lista.length === 0) {
            container.innerHTML = '<div class="empty-status">Nenhum pedido</div>';
            return;
        }

        lista.forEach(pedido => {
            const card = criarCardPedido(pedido);
            container.appendChild(card);
        });
    });
    
    // Adicionar event listeners aos botões de ação
    adicionarEventListenersBotoes();
    
    atualizarResumo();
}

// Flag para garantir que o listener seja adicionado apenas uma vez
let eventListenersBotoesAdicionados = false;

function adicionarEventListenersBotoes() {
    // Se gestor_pedidos.js está carregado e estamos na página de pedidos,
    // não adicionar listeners aqui (gestor_pedidos.js já adiciona listeners diretamente nos botões)
    const isGestorPedidosPage = window.location.pathname.includes('/pedidos') || 
                                 window.location.pathname.includes('gestor_pedidos') ||
                                 document.querySelector('.gestor-pedidos');
    if (isGestorPedidosPage) {
        return;
    }
    
    if (eventListenersBotoesAdicionados) return;
    
    const expedicaoBoard = document.getElementById('expedicaoBoard');
    if (!expedicaoBoard) return;
    
    expedicaoBoard.addEventListener('click', function(e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const action = btn.dataset.action;
        const pedidoId = parseInt(btn.dataset.pedidoId);
        
        if (!pedidoId || isNaN(pedidoId)) return;
        
        switch(action) {
            case 'detalhes':
                abrirModalDetalhes(pedidoId);
                break;
            case 'imprimir':
                imprimirComandaManual(pedidoId);
                break;
            case 'cancelar':
                cancelarPedido(pedidoId);
                break;
            case 'atualizar':
                const novoStatus = btn.dataset.status;
                if (novoStatus) {
                    atualizarStatus(pedidoId, novoStatus);
                }
                break;
        }
    });
    
    eventListenersBotoesAdicionados = true;
}

function atualizarResumo() {
    const andamento = ['pendente', 'aceito', 'preparo', 'entrega'];
    const totalEmAndamento = pedidos.filter(p => andamento.includes((p.status || '').toLowerCase())).length;
    const pendentes = pedidosAgrupadosPorStatus.pendente?.length ?? 0;
    const entrega = pedidosAgrupadosPorStatus.entrega?.length ?? 0;
    const preparo = pedidosAgrupadosPorStatus.preparo?.length ?? 0;
    const pendencias = pedidos.filter(p => p.possui_pendencia || p.tem_chat_pendente).length;

    const totais = pedidos
        .map(p => parseFloat(p.totalPedido ?? p.valor_total ?? p.total ?? 0))
        .filter(valor => !Number.isNaN(valor) && valor > 0);
    const ticketMedio = totais.length > 0 ? totais.reduce((acc, valor) => acc + valor, 0) / totais.length : 0;

    const tempos = pedidos
        .map(p => parseFloat(p.tempo_preparo_minutos ?? p.tempo_preparo ?? NaN))
        .filter(valor => !Number.isNaN(valor) && valor > 0);
    const tempoMedio = tempos.length > 0 ? tempos.reduce((acc, valor) => acc + valor, 0) / tempos.length : null;

    const setTexto = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    };

    setTexto('resumoPendente', pendentes);
    setTexto('resumoPreparo', preparo);
    setTexto('resumoPendencias', pendencias);
    setTexto('resumoTempoMedio', tempoMedio ? `${tempoMedio.toFixed(0)} min` : '--');

    const tagLogistica = document.getElementById('tagLogistica');
    if (tagLogistica) {
        if (entrega > 0) {
            tagLogistica.classList.add('active');
        } else {
            tagLogistica.classList.remove('active');
        }
    }

    // Tocar som automaticamente quando houver pedidos pendentes
    if (pendentes > 0) {
        tocarSomPendentes();
    } else {
        pararSomPendentes();
    }

    ultimoTotalPendentes = pendentes;
}

function aplicarFiltrosPainel() {
    const filtro = (textoBuscaPainel || '').trim().toLowerCase();
    const cards = document.querySelectorAll('.pedido-card');
    cards.forEach(card => {
        if (!filtro) {
            card.classList.remove('hidden-by-search');
            return;
        }
        const base = card.dataset.search || '';
        if (base.includes(filtro)) {
            card.classList.remove('hidden-by-search');
        } else {
            card.classList.add('hidden-by-search');
        }
    });
}

function calcularTempoDecorrido(dataIso) {
    if (!dataIso) {
        return { texto: '-', classe: 'tempo-neutral' };
    }

    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) {
        return { texto: '-', classe: 'tempo-neutral' };
    }

    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.max(0, Math.round(diffMs / 60000));

    let classe = 'tempo-normal';
    if (diffMin >= 15) {
        classe = 'tempo-critico';
    } else if (diffMin >= 8) {
        classe = 'tempo-alerta';
    }

    const texto = diffMin <= 0 ? 'Agora' : `${diffMin}min`;
    return { texto, classe };
}

function focarColuna(status) {
    const board = document.getElementById('expedicaoBoard');
    if (!board) return;

    if (!status) {
        board.scrollTo({ left: 0, behavior: 'smooth' });
        return;
    }

    const coluna = board.querySelector(`.board-column[data-status="${status}"]`);
    if (coluna) {
        coluna.classList.add('column-highlight');
        coluna.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        setTimeout(() => coluna.classList.remove('column-highlight'), 1400);
    }
}

function focarPedidoPorId(valor) {
    const normalizado = (valor || '').replace(/\D/g, '');
    if (!normalizado) return;

    const card = document.querySelector(`.pedido-card[data-pedido-id="${normalizado}"]`);
    if (card) {
        card.classList.add('pedido-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => card.classList.remove('pedido-highlight'), 1600);
    } else {
        showWarning('Pedido não encontrado no painel atual.');
    }
}

function alternarFullScreenPainel() {
    const wrapper = document.querySelector('.expedicao-layout');
    if (!wrapper) return;

    if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function tocarSomPendentes() {
    if (!audioNovoPedido || audioNovoPedido.loop !== true) {
        return;
    }
    if (audioNovoPedido.paused || audioNovoPedido.currentTime === 0) {
        audioNovoPedido.play().catch(() => {});
    }
}

function pararSomPendentes() {
    if (!audioNovoPedido) return;
    audioNovoPedido.pause();
    audioNovoPedido.currentTime = 0;
}

function registrarControlesPainel() {
    // Inicializar áudio automaticamente
    if (!audioNovoPedido && typeof Audio !== 'undefined') {
        audioNovoPedido = new Audio(SOM_PEDIDOS_ARQUIVO);
        audioNovoPedido.loop = true;
        audioNovoPedido.preload = 'auto';
        audioNovoPedido.volume = 0.8;

        const liberarAudio = () => {
            if (requisicaoAudioLiberada) return;
            audioNovoPedido.play().then(() => {
                audioNovoPedido.pause();
                audioNovoPedido.currentTime = 0;
                requisicaoAudioLiberada = true;
            }).catch(() => {
                // autoplay bloqueado; aguarda próxima interação
            });
        };

        document.addEventListener('click', liberarAudio, { once: true });
        document.addEventListener('keydown', liberarAudio, { once: true });
    }
}

function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.dataset.pedidoId = String(pedido.idpedido);
    card.dataset.status = pedido.status;
    const textoPesquisa = [
        pedido.idpedido,
        pedido.nome_cliente,
        pedido.telefone_cliente
    ].map(valor => (valor || '').toString().toLowerCase()).join(' ');
    card.dataset.search = textoPesquisa;

    const tempoInfo = calcularTempoDecorrido(pedido.data_pedido || pedido.data);
    const status = (pedido.status || '').toLowerCase();
    const nomeCliente = escapeHtml(pedido.nome_cliente || pedido.cliente?.nome || pedido.cliente || 'Cliente');

    // Formatar tempo como "há Xmin" (sem espaço)
    const tempoTexto = tempoInfo.texto === 'Agora' ? 'Agora' : `há ${tempoInfo.texto.replace(' ', '')}`;

    card.innerHTML = `
        <div class="pedido-card-header">
            <span class="pedido-numero-grande">${String(pedido.idpedido).padStart(4, '0')}</span>
            <span class="pedido-tempo ${tempoInfo.classe}">${tempoTexto}</span>
        </div>

        <div class="pedido-cliente-nome">
            ${nomeCliente}
        </div>

        <div class="pedido-actions">
            ${getBotoesAcao(status, pedido.idpedido)}
        </div>
    `;

    return card;
}

async function atualizarStatus(id, novoStatus) {
    const pedidoId = Number(id);
    if (!Number.isFinite(pedidoId)) return;
    try {
        const headers = headersAutenticados({ 'Content-Type': 'application/json' });
        if (!headers) return;

        const response = await fetch(`/api/pedidos/${pedidoId}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: novoStatus })
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login_cadastro.html';
                return;
            }
            throw new Error('Erro ao atualizar status');
        }

        pedidos = pedidos.map(p => p.idpedido === pedidoId ? { ...p, status: novoStatus } : p);
        agruparPedidosPorStatus();
        renderizarColunas();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showError('Não foi possível atualizar o status do pedido.');
    }
}

async function cancelarPedido(id) {
    const pedidoId = Number(id);
    if (!Number.isFinite(pedidoId)) return;
    if (!confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const headers = headersAutenticados();
        if (!headers) return;

        const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, { method: 'PUT', headers });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login_cadastro.html';
                return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.erro || 'Erro ao cancelar pedido');
        }

        // Remover pedido da lista ou atualizar status
        pedidos = pedidos.filter(p => p.idpedido !== pedidoId);
        agruparPedidosPorStatus();
        renderizarColunas();
        
        // Fechar modal se estiver aberto
        const modal = document.getElementById('modalDetalhes');
        if (modal && modal.style.display === 'block') {
            fecharModalDetalhes();
        }
    } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        showError('Não foi possível cancelar o pedido: ' + (error.message || 'Erro desconhecido'));
    }
}


function getBotoesAcao(status, pedidoId) {
    let botoes = '';
    
    // Botão de detalhes sempre presente
    botoes += `
        <button class="action-btn btn-detalhes" data-action="detalhes" data-pedido-id="${pedidoId}">
            <i class="fas fa-eye"></i>
            Detalhes
        </button>
    `;
    
    // Botão de impressão sempre presente (exceto para pedidos cancelados)
    if (status !== 'cancelado') {
        botoes += `
            <button class="action-btn btn-imprimir" data-action="imprimir" data-pedido-id="${pedidoId}" title="Imprimir Comanda">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
        `;
    }
    
    // Botões específicos por status
    switch(status) {
        case 'pendente':
            botoes += `
                <button class="action-btn btn-aceitar" data-action="atualizar" data-pedido-id="${pedidoId}" data-status="aceito">
                    <i class="fas fa-check"></i>
                    Aceitar
                </button>
                <button class="action-btn btn-cancelar" data-action="cancelar" data-pedido-id="${pedidoId}">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
            `;
            break;
        case 'aceito':
            botoes += `
                <button class="action-btn btn-preparar" data-action="atualizar" data-pedido-id="${pedidoId}" data-status="preparo">
                    <i class="fas fa-play"></i>
                    Iniciar Preparo
                </button>
                <button class="action-btn btn-cancelar" data-action="cancelar" data-pedido-id="${pedidoId}">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
            `;
            break;
        case 'preparo':
            botoes += `
                <button class="action-btn btn-pronto" data-action="atualizar" data-pedido-id="${pedidoId}" data-status="entrega">
                    <i class="fas fa-check-circle"></i>
                    Pronto
                </button>
                <button class="action-btn btn-cancelar" data-action="cancelar" data-pedido-id="${pedidoId}">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
            `;
            break;
        case 'entrega':
            botoes += `
                <button class="action-btn btn-entregar" data-action="atualizar" data-pedido-id="${pedidoId}" data-status="concluido">
                    <i class="fas fa-truck"></i>
                    Entregar
                </button>
                <button class="action-btn btn-cancelar" data-action="cancelar" data-pedido-id="${pedidoId}">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
            `;
            break;
        case 'concluido':
            // Apenas detalhes e impressão (não pode cancelar pedido já concluído)
            break;
        case 'cancelado':
            // Apenas detalhes (pedido já cancelado)
            break;
    }
    
    return botoes;
}

function escapeHtml(texto) {
    if (!texto) {
        return '';
    }

    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function abrirModalDetalhes(pedidoId) {
    const modal = document.getElementById('modalDetalhes');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalBody = document.getElementById('modalBody');

    modalTitulo.textContent = `Pedido #${String(pedidoId).padStart(3, '0')}`;
    modalBody.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Carregando detalhes...</p></div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    try {
        const headers = headersAutenticados();
        if (!headers) return;

        const response = await fetch(`/api/pedidos/${pedidoId}`, { headers });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login_cadastro.html';
                return;
            }
            throw new Error('Erro ao buscar detalhes do pedido');
        }

        const pedido = await response.json();
        const { data, hora } = formatarDataHora(pedido.data_pedido);
        const totalPedidoValor = Number(pedido.valor_total ?? pedido.total ?? 0);
        
        // Montar endereço - a função montarEnderecoPedido já trata os campos diretamente ou dentro de endereco
        const endereco = montarEnderecoPedido(pedido);

        const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : [];
        const itensDetalhesHtml = itensPedido.map(item => {
            const nomeItem = item.nome || item.produto_nome || 'Produto';
            const quantidade = item.quantidade ?? item.qtd ?? 1;
            const precoUnitario = Number(item.preco || 0);
            const precoPontosUnitario = Number(item.preco_pontos || 0);
            const foiPagoComPontos = item.pagar_com_pontos === true || item.pagar_com_pontos === 1;
            const totalItem = Number(item.totalItem ?? (precoUnitario * quantidade));
            const totalPontos = foiPagoComPontos && precoPontosUnitario > 0 ? precoPontosUnitario * quantidade : 0;
            const observacao = item.observacao ? `<p class="item-observacao-detalhe"><strong>Observação:</strong> ${escapeHtml(item.observacao)}</p>` : '';
            const opcionaisHtml = (item.opcionais || []).map(opcional => `
                <li class="opcional-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${escapeHtml(opcional.nome)}</span>
                    ${opcional.preco > 0 ? `<span class="opcional-preco">+R$ ${formatarPreco(opcional.preco)}</span>` : ''}
                </li>
            `).join('');

            return `
                <div class="item-detalhes-card">
                    <div class="item-header">
                        <h5 class="item-nome">${escapeHtml(nomeItem)}</h5>
                        <span class="item-preco ${foiPagoComPontos ? 'item-pontos' : ''}">
                            ${foiPagoComPontos && totalPontos > 0 
                                ? `${totalPontos.toLocaleString('pt-BR')} pontos` 
                                : `R$ ${formatarPreco(totalItem)}`}
                        </span>
                    </div>
                    <div class="item-detalhes-body">
                        <div class="item-meta">
                            <span class="item-meta-item">
                                <i class="fas fa-hashtag"></i>
                                <strong>Quantidade:</strong> ${quantidade}
                            </span>
                            <span class="item-meta-item">
                                <i class="fas ${foiPagoComPontos ? 'fa-star' : 'fa-tag'}"></i>
                                <strong>Preço unitário:</strong> 
                                ${foiPagoComPontos && precoPontosUnitario > 0 
                                    ? `<span class="preco-pontos-badge">${precoPontosUnitario.toLocaleString('pt-BR')} pontos</span>` 
                                    : `R$ ${formatarPreco(precoUnitario)}`}
                            </span>
                        </div>
                        ${opcionaisHtml ? `
                        <div class="item-opcionais">
                            <span class="opcionais-label"><i class="fas fa-list-ul"></i> Opcionais:</span>
                            <ul class="opcionais-list">${opcionaisHtml}</ul>
                        </div>
                        ` : ''}
                        ${observacao}
                    </div>
                </div>
            `;
        }).join('');

        modalBody.innerHTML = `
            <div class="pedido-detalhes">
                <!-- Informações do Cliente -->
                <div class="pedido-info-card cliente-card">
                    <div class="info-card-header">
                        <div class="info-card-icon cliente-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <h4>Informações do Cliente</h4>
                    </div>
                    <div class="info-card-body">
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-user-circle"></i> Nome</span>
                            <span class="info-value">${escapeHtml(pedido.nome_cliente || 'Cliente')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-phone"></i> Telefone</span>
                            <span class="info-value">${escapeHtml(pedido.telefone_cliente || '-')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-map-marker-alt"></i> Endereço</span>
                            <span class="info-value endereco-value">${escapeHtml(endereco)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Informações do Pedido -->
                <div class="pedido-info-card pedido-card-info">
                    <div class="info-card-header">
                        <div class="info-card-icon pedido-icon">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <h4>Informações do Pedido</h4>
                    </div>
                    <div class="info-card-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label"><i class="fas fa-calendar"></i> Data</span>
                                <span class="info-value">${data}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label"><i class="fas fa-clock"></i> Hora</span>
                                <span class="info-value">${hora}</span>
                            </div>
                        </div>
                        <div class="info-item status-item">
                            <span class="info-label"><i class="fas fa-info-circle"></i> Status</span>
                            <span class="status-badge status-${pedido.status}">${statusLabels[pedido.status] || pedido.status}</span>
                        </div>
                        ${pedido.observacoes ? `
                        <div class="info-item observacoes-item">
                            <span class="info-label"><i class="fas fa-sticky-note"></i> Observações</span>
                            <span class="info-value observacoes-value">${escapeHtml(pedido.observacoes)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Itens do Pedido -->
                <div class="pedido-itens-card">
                    <div class="info-card-header">
                        <div class="info-card-icon itens-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <h4>Itens do Pedido</h4>
                    </div>
                    <div class="itens-container">
                        ${itensDetalhesHtml || '<p class="empty-message">Nenhum item encontrado.</p>'}
                    </div>
                </div>
                
                <!-- Total do Pedido -->
                <div class="pedido-total-card">
                    <div class="total-content">
                        <span class="total-label">Total do Pedido</span>
                        <span class="total-value">R$ ${formatarPreco(totalPedidoValor)}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        modalBody.innerHTML = '<div class="empty-status erro">Erro ao carregar detalhes do pedido.</div>';
    }
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('modalDetalhes');
    if (event.target === modal) {
        fecharModalDetalhes();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    registrarControlesPainel();
    
    // Adicionar event listeners aos botões (delegação de eventos)
    adicionarEventListenersBotoes();

    // Carregar pedidos
    carregarPedidos().then(() => {
        ultimoTotalPendentes = pedidosAgrupadosPorStatus.pendente?.length ?? 0;
        // Tocar som automaticamente se houver pedidos pendentes
        if (ultimoTotalPendentes > 0) {
            tocarSomPendentes();
        }
    });
});