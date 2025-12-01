document.addEventListener('DOMContentLoaded', function() {
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarCenter = document.querySelector('.navbar-center');
    if (navbarToggle && navbarCenter) {
        navbarToggle.addEventListener('click', () => {
            navbarToggle.classList.toggle('active');
            navbarCenter.classList.toggle('active');
        });
    }
});

let textoBuscaPainel = '';
const statusEntradaMap = {
    pendente: 'pendente',
    aceito: 'aceito',
    preparando: 'preparo',
    pronto: 'entrega',
    entregue: 'entrega',
    concluido: 'concluido',
    cancelado: 'cancelado'
};

function isAdmin() {
    try {
        const token = obterToken();
        if (!token) return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.type === 'admin' || payload.type === 'adm';
    } catch {
        return false;
    }
}

function obterToken() {
    // Para testes: não redirecionar se não tiver token
    return localStorage.getItem('token');
}

function headersAutenticados(extraHeaders = {}) {
    const token = obterToken();
    if (!token) return null;
    return {
        'Authorization': `Bearer ${token}`,
        ...extraHeaders
    };
}

async function carregarPedidosGestor() {
    try {
        const token = obterToken();
        const url = token && isAdmin() ? '/api/pedidos/admin' : '/api/pedidos/publico/admin';
        
        // Se não tiver token, usar rota pública
        const headers = token ? headersAutenticados() : {};
        
        const response = await fetch(url, { headers });
        if (!response.ok) {
            // Não redirecionar para login durante testes
            if (response.status === 401 && token) {
                // Se tinha token mas expirou, tentar rota pública
                const responsePublico = await fetch('/api/pedidos/publico/admin', {});
                if (responsePublico.ok) {
                    const pedidosApi = await responsePublico.json();
                    processarPedidos(pedidosApi);
                    return true;
                }
            }
            throw new Error('Erro ao buscar pedidos');
        }

        const pedidosApi = await response.json();
        processarPedidos(pedidosApi);
        return true;
    } catch {
        ['pendente', 'aceito', 'preparo', 'entrega', 'concluido'].forEach(status => {
            const container = document.getElementById(`pedidos-${status}`);
            if (container) {
                container.innerHTML = '<div class="empty-status erro">Erro ao carregar pedidos</div>';
            }
        });
        return false;
    }
}

function processarPedidos(pedidosApi) {
    pedidos = Array.isArray(pedidosApi)
        ? pedidosApi
            .filter(p => (p.status || '').toLowerCase() !== 'cancelado')
            .map(p => {
                const statusConvertido = statusEntradaMap[(p.status || '').toLowerCase()] || (p.status || '').toLowerCase();
                return {
                    ...p,
                    status_original: p.status,
                    status: statusConvertido,
                    endereco_formatado: montarEnderecoPedido(p)
                };
            })
        : [];
    agruparPedidosPorStatusGestor();
    renderizarColunasGestor();
}

function agruparPedidosPorStatusGestor() {
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

function renderizarColunasGestor() {
    requestAnimationFrame(() => {
        statusOrdem.forEach(status => {
            const container = document.getElementById(`pedidos-${status}`);
            const countElement = document.getElementById(`count-${status}`);

            if (!container) return;
            
            const lista = pedidosAgrupadosPorStatus[status] || [];
            if (countElement) {
                countElement.textContent = lista.length;
            }

            if (lista.length === 0) {
                container.innerHTML = '<div class="empty-status">Nenhum pedido</div>';
                return;
            }

            const fragment = document.createDocumentFragment();
            lista.forEach(pedido => {
                const card = criarCardPedido(pedido);
                fragment.appendChild(card);
            });
            container.innerHTML = '';
            container.appendChild(fragment);
        });
        atualizarResumoGestor();
    });
}

function atualizarResumoGestor() {
    const pendentes = pedidosAgrupadosPorStatus.pendente?.length ?? 0;
    const entrega = pedidosAgrupadosPorStatus.entrega?.length ?? 0;
    const preparo = pedidosAgrupadosPorStatus.preparo?.length ?? 0;
    const pendencias = pedidos.filter(p => p.possui_pendencia || p.tem_chat_pendente).length;

    const totais = pedidos
        .map(p => parseFloat(p.totalPedido ?? p.valor_total ?? p.total ?? 0))
        .filter(v => !Number.isNaN(v) && v > 0);
    const ticketMedio = totais.length > 0 ? totais.reduce((a, v) => a + v, 0) / totais.length : 0;

    const tempos = pedidos
        .map(p => parseFloat(p.tempo_preparo_minutos ?? p.tempo_preparo ?? NaN))
        .filter(v => !Number.isNaN(v) && v > 0);
    const tempoMedio = tempos.length > 0 ? tempos.reduce((a, v) => a + v, 0) / tempos.length : null;

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
        tagLogistica.classList.toggle('active', entrega > 0);
    }

    const somAtivo = somHabilitado();
    const temNovosPendentes = pendentes > ultimoTotalPendentes;
    
    if (somAtivo && pendentes > 0) {
        if (temNovosPendentes || (ultimoTotalPendentes === 0 && pendentes > 0)) {
            tocarSomPendentes();
        }
    } else if (pendentes === 0) {
        pararSomPendentes();
    }

    ultimoTotalPendentes = pendentes;
}

function aplicarFiltrosPainel() {
    const filtro = (textoBuscaPainel || '').trim().toLowerCase();
    document.querySelectorAll('.pedido-card').forEach(card => {
        const base = card.dataset.search || '';
        card.classList.toggle('hidden-by-search', filtro && !base.includes(filtro));
    });
}

function calcularTempoDecorrido(dataIso) {
    if (!dataIso) return { texto: '-', classe: 'tempo-neutral' };

    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return { texto: '-', classe: 'tempo-neutral' };

    const diffMin = Math.max(0, Math.round((Date.now() - data) / 60000));
    let classe = 'tempo-normal';
    if (diffMin >= 15) classe = 'tempo-critico';
    else if (diffMin >= 8) classe = 'tempo-alerta';

    return { texto: diffMin <= 0 ? 'Agora' : `${diffMin} min`, classe };
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
        wrapper.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

function somHabilitado() {
    const toggleSom = document.getElementById('toggleSomPedidos');
    if (!toggleSom) {
        const salvo = localStorage.getItem('painel_som_habilitado');
        return salvo !== 'false';
    }
    return toggleSom.checked;
}

function tocarSomPendentes() {
    if (!somHabilitado() || !audioNovoPedido) {
        if (!audioNovoPedido) inicializarAudio();
        return;
    }
    
    if (audioNovoPedido.loop !== true) {
        audioNovoPedido.loop = true;
    }
    
    const tentarTocar = () => {
        if (!audioNovoPedido) return;
        
        if (audioNovoPedido.paused || audioNovoPedido.currentTime === 0) {
            audioNovoPedido.play().catch(() => {
                if (!requisicaoAudioLiberada) {
                    const liberarAudio = () => {
                        if (requisicaoAudioLiberada || !audioNovoPedido) return;
                        audioNovoPedido.play().then(() => {
                            requisicaoAudioLiberada = true;
                        }).catch(() => {});
                    };
                    document.addEventListener('click', liberarAudio, { once: true });
                    document.addEventListener('keydown', liberarAudio, { once: true });
                    document.addEventListener('touchstart', liberarAudio, { once: true });
                }
            });
        }
    };
    
    if (audioNovoPedido.readyState >= 2) {
        tentarTocar();
    } else {
        const handler = () => tentarTocar();
        audioNovoPedido.addEventListener('canplaythrough', handler, { once: true });
        audioNovoPedido.addEventListener('loadeddata', handler, { once: true });
        audioNovoPedido.load();
    }
}

function pararSomPendentes() {
    if (!audioNovoPedido) return;
    audioNovoPedido.pause();
    audioNovoPedido.currentTime = 0;
}

function inicializarAudio() {
    if (audioNovoPedido || typeof Audio === 'undefined') return;
    
    try {
        audioNovoPedido = new Audio(SOM_PEDIDOS_ARQUIVO);
        audioNovoPedido.loop = true;
        audioNovoPedido.preload = 'auto';
        audioNovoPedido.volume = 0.8;
        
        const liberarAudio = () => {
            if (requisicaoAudioLiberada || !audioNovoPedido) return;
            audioNovoPedido.play().then(() => {
                audioNovoPedido.pause();
                audioNovoPedido.currentTime = 0;
                requisicaoAudioLiberada = true;
            }).catch(() => {});
        };
        
        document.addEventListener('click', liberarAudio, { once: true });
        document.addEventListener('keydown', liberarAudio, { once: true });
        document.addEventListener('touchstart', liberarAudio, { once: true });
    } catch {}
}

function registrarControlesPainel() {
    const toggleSom = document.getElementById('toggleSomPedidos');
    if (toggleSom) {
        const salvo = localStorage.getItem('painel_som_habilitado');
        toggleSom.checked = salvo !== null ? salvo === 'true' : true;
        if (salvo === null) localStorage.setItem('painel_som_habilitado', 'true');
        
        toggleSom.addEventListener('change', () => {
            localStorage.setItem('painel_som_habilitado', toggleSom.checked ? 'true' : 'false');
            if (!toggleSom.checked) {
                pararSomPendentes();
            } else if ((pedidosAgrupadosPorStatus.pendente?.length ?? 0) > 0) {
                tocarSomPendentes();
            }
        });
    }
    inicializarAudio();
}

function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.draggable = true;
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
    const tempoTexto = tempoInfo.texto === 'Agora' ? 'Agora' : `há ${tempoInfo.texto.replace(' ', '')}`;

    card.innerHTML = `
        <div class="pedido-card-header">
            <span class="pedido-numero-grande">#${String(pedido.idpedido).padStart(3, '0')}</span>
            <span class="pedido-tempo ${tempoInfo.classe}">${tempoTexto}</span>
        </div>

        <div class="pedido-cliente-nome">
            ${nomeCliente}
        </div>

        <div class="pedido-actions">
            ${getBotoesAcao(status, pedido.idpedido)}
        </div>
    `;

    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

async function atualizarStatus(id, novoStatus) {
    const pedidoId = Number(id);
    if (!Number.isFinite(pedidoId)) return;
    
    try {
        const token = obterToken();
        const headers = token 
            ? headersAutenticados({ 'Content-Type': 'application/json' })
            : { 'Content-Type': 'application/json' };
        
        // Para testes, usar rota pública se não tiver token
        const url = token 
            ? `/api/pedidos/${pedidoId}/status`
            : `/api/pedidos/publico/${pedidoId}/status`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: novoStatus })
        });

        if (!response.ok) {
            // Não redirecionar durante testes
            if (response.status === 401 && token) {
                showWarning('Sessão expirada. Recarregue a página.');
                return;
            }
            throw new Error('Erro ao atualizar status');
        }

        pedidos = pedidos.map(p => p.idpedido === pedidoId ? { ...p, status: novoStatus } : p);
        agruparPedidosPorStatusGestor();
        renderizarColunasGestor();
    } catch {
        showError('Não foi possível atualizar o status do pedido.');
    }
}

async function cancelarPedido(id) {
    const pedidoId = Number(id);
    if (!Number.isFinite(pedidoId)) return;
    
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
        return;
    }

    try {
        const token = obterToken();
        const headers = token ? headersAutenticados() : {};
        
        // Para testes, usar rota pública se não tiver token
        const url = token 
            ? `/api/pedidos/${pedidoId}/cancelar`
            : `/api/pedidos/publico/${pedidoId}/cancelar`;
        
        const response = await fetch(url, { method: 'PUT', headers });
        
        if (!response.ok) {
            // Não redirecionar durante testes
            if (response.status === 401 && token) {
                showWarning('Sessão expirada. Recarregue a página.');
                return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.erro || 'Erro ao cancelar pedido');
        }

        pedidos = pedidos.filter(p => p.idpedido !== pedidoId);
        agruparPedidosPorStatusGestor();
        renderizarColunasGestor();
    } catch (error) {
        showError('Não foi possível cancelar o pedido: ' + (error.message || 'Erro desconhecido'));
    }
}

function getBotoesAcao(status, pedidoId) {
    const btnCancelar = `<button class="action-btn btn-cancelar" data-action="cancelar" data-pedido-id="${pedidoId}">
        <i class="fas fa-times"></i>
        Cancelar
    </button>`;
    
    let botoes = `<button class="action-btn btn-detalhes" data-action="detalhes" data-pedido-id="${pedidoId}">
        <i class="fas fa-eye"></i>
        Detalhes
    </button>`;
    
    if (status !== 'cancelado') {
        botoes += `<button class="action-btn btn-imprimir" data-action="imprimir" data-pedido-id="${pedidoId}" title="Imprimir Comanda">
            <i class="fas fa-print"></i>
            Imprimir
        </button>`;
    }
    
    const botoesStatus = {
        pendente: `<button class="action-btn btn-aceitar" data-action="atualizar-status" data-pedido-id="${pedidoId}" data-status="aceito">
            <i class="fas fa-check"></i>
            Aceitar
        </button>${btnCancelar}`,
        aceito: `<button class="action-btn btn-preparar" data-action="atualizar-status" data-pedido-id="${pedidoId}" data-status="preparo">
            <i class="fas fa-play"></i>
            Iniciar Preparo
        </button>${btnCancelar}`,
        preparo: `<button class="action-btn btn-pronto" data-action="atualizar-status" data-pedido-id="${pedidoId}" data-status="entrega">
            <i class="fas fa-check-circle"></i>
            Pronto
        </button>${btnCancelar}`,
        entrega: `<button class="action-btn btn-entregar" data-action="atualizar-status" data-pedido-id="${pedidoId}" data-status="concluido">
            <i class="fas fa-truck"></i>
            Entregar
        </button>${btnCancelar}`
    };
    
    return botoes + (botoesStatus[status] || '');
}

function escapeHtml(texto) {
    if (!texto) return '';
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

    if (!modal || !modalTitulo || !modalBody) return;

    modalTitulo.textContent = `Pedido #${String(pedidoId).padStart(3, '0')}`;
    modalBody.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Carregando detalhes...</p></div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    (async () => {
        try {
            const token = obterToken();
            const headers = token ? headersAutenticados() : {};
            
            // Para testes, tentar rota pública se não tiver token
            const url = token 
                ? `/api/pedidos/${pedidoId}`
                : `/api/pedidos/publico/${pedidoId}`;
            
            const response = await fetch(url, { headers });
            if (!response.ok) {
                // Não redirecionar durante testes
                if (response.status === 401 && token) {
                    showWarning('Sessão expirada. Recarregue a página.');
                    return;
                }
                throw new Error('Erro ao buscar detalhes do pedido');
            }

            const pedido = await response.json();
            
            requestAnimationFrame(() => {
                const { data, hora } = formatarDataHora(pedido.data_pedido);
                const totalPedidoValor = Number(pedido.valor_total ?? pedido.total ?? 0);
                const endereco = pedido.endereco_formatado || montarEnderecoPedido(pedido);

                const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : [];
                const itensDetalhesHtml = itensPedido.map(item => {
                    const nomeItem = item.nome || item.produto_nome || 'Produto';
                    const quantidade = item.quantidade ?? item.qtd ?? 1;
                    const precoUnitario = Number(item.preco || 0);
                    const totalItem = Number(item.totalItem ?? (precoUnitario * quantidade));
                    const observacao = item.observacao ? `<p class="item-observacao-detalhe"><strong>Observação:</strong> ${escapeHtml(item.observacao)}</p>` : '';
                    const opcionaisHtml = (item.opcionais || []).map(op => 
                        `<li>${escapeHtml(op.nome)}${op.preco > 0 ? ` (+R$ ${formatarPreco(op.preco)})` : ''}</li>`
                    ).join('');

                    return `<div class="item-detalhes">
                        <div class="item-info">
                            <h5>${escapeHtml(nomeItem)}</h5>
                            <p><strong>Quantidade:</strong> ${quantidade}</p>
                            <p><strong>Preço unitário:</strong> R$ ${formatarPreco(precoUnitario)}</p>
                            ${opcionaisHtml ? `<p><strong>Opcionais:</strong></p><ul>${opcionaisHtml}</ul>` : ''}
                            ${observacao}
                        </div>
                        <div class="item-preco-detalhes">R$ ${formatarPreco(totalItem)}</div>
                    </div>`;
                }).join('');

                modalBody.innerHTML = `<div class="pedido-detalhes">
                    <div class="pedido-info-detalhes">
                        <h4><i class="fas fa-user"></i> Informações do Cliente</h4>
                        <p><strong>Nome:</strong> ${escapeHtml(pedido.nome_cliente || 'Cliente')}</p>
                        <p><strong>Telefone:</strong> ${escapeHtml(pedido.telefone_cliente || '-')}</p>
                        <p><strong>Endereço:</strong> ${escapeHtml(endereco)}</p>
                    </div>
                    <div class="pedido-info-detalhes">
                        <h4><i class="fas fa-info-circle"></i> Informações do Pedido</h4>
                        <p><strong>Data:</strong> ${data}</p>
                        <p><strong>Hora:</strong> ${hora}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-${pedido.status}">${statusLabels[pedido.status] || pedido.status}</span></p>
                        ${pedido.observacoes ? `<p><strong>Observações gerais:</strong> ${escapeHtml(pedido.observacoes)}</p>` : ''}
                    </div>
                    <div class="pedido-itens-detalhes">
                        <h4><i class="fas fa-list"></i> Itens do Pedido</h4>
                        ${itensDetalhesHtml || '<p>Nenhum item encontrado.</p>'}
                    </div>
                    <div class="pedido-total-detalhes">
                        <strong>Total do Pedido: R$ ${formatarPreco(totalPedidoValor)}</strong>
                    </div>
                </div>`;
            });
        } catch {
            requestAnimationFrame(() => {
                modalBody.innerHTML = '<div class="empty-status erro">Erro ao carregar detalhes do pedido.</div>';
            });
        }
    })();
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = (e) => {
    if (e.target?.id === 'modalDetalhes') fecharModalDetalhes();
};

let draggedElement = null;

function handleDragStart() {
    draggedElement = this;
    this.style.opacity = '0.5';
}

function handleDragEnd() {
    this.style.opacity = '1';
    draggedElement = null;
}


let eventListenersInicializados = false;

document.addEventListener('DOMContentLoaded', function() {
    if (eventListenersInicializados) return;
    eventListenersInicializados = true;
    
    registrarControlesPainel();

    document.querySelectorAll('.board-column').forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        const body = column.querySelector('.board-column-body');
        if (body) {
            body.addEventListener('dragover', handleDragOver);
            body.addEventListener('drop', handleDrop);
        }
    });

    const expedicaoBoard = document.getElementById('expedicaoBoard');
    if (expedicaoBoard) {
        expedicaoBoard.addEventListener('click', function(e) {
            const btn = e.target.closest('.action-btn');
            if (!btn || !btn.dataset.action) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const action = btn.dataset.action;
            const pedidoId = Number(btn.dataset.pedidoId);
            if (!pedidoId || isNaN(pedidoId)) return;
            
            const statusValue = btn.dataset.status;
            
            if (action === 'cancelar') {
                Promise.resolve().then(() => cancelarPedido(pedidoId));
            } else if (action === 'detalhes') {
                abrirModalDetalhes(pedidoId);
            } else if (action === 'imprimir' && typeof imprimirComandaManual === 'function') {
                imprimirComandaManual(pedidoId);
            } else if (action === 'atualizar-status') {
                atualizarStatus(pedidoId, statusValue);
            }
        });
    }

    const btnFecharModal = document.getElementById('btnFecharModalDetalhes');
    const btnFecharModalFooter = document.getElementById('btnFecharModalDetalhesFooter');
    btnFecharModal?.addEventListener('click', fecharModalDetalhes);
    btnFecharModalFooter?.addEventListener('click', fecharModalDetalhes);

    inicializarAudio();
    
    carregarPedidosGestor().then(() => {
        ultimoTotalPendentes = pedidosAgrupadosPorStatus.pendente?.length ?? 0;
        setTimeout(() => {
            if (somHabilitado() && ultimoTotalPendentes > 0) tocarSomPendentes();
        }, 1000);
    });
    
    setInterval(() => carregarPedidosGestor(), 10000);
    
});

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedElement) return;
    
    const coluna = e.currentTarget.classList.contains('board-column')
        ? e.currentTarget
        : e.currentTarget.closest('.board-column');
    if (!coluna) return;

    const novoStatus = coluna.dataset.status;
    const pedidoId = Number(draggedElement.dataset.pedidoId);
    if (pedidoId) atualizarStatus(pedidoId, novoStatus);
}