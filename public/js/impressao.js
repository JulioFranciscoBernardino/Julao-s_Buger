// Menu mobile toggle
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

// Variáveis globais de pedidos
let pedidos = [];
let pedidosAgrupadosPorStatus = {};
let textoBuscaPainel = '';
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
const statusEntradaMap = {
    pendente: 'pendente',
    aceito: 'aceito',
    preparando: 'preparo',
    pronto: 'entrega',
    entregue: 'entrega',
    concluido: 'concluido',
    cancelado: 'cancelado'
};

// ============================================
// IMPRESSÃO DIRETA PELO NAVEGADOR
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
    const partes = [
        pedido.logradouro,
        pedido.numero ? `, ${pedido.numero}` : '',
        pedido.bairro ? ` - ${pedido.bairro}` : '',
        pedido.cidade ? ` - ${pedido.cidade}` : '',
        pedido.estado ? `/${pedido.estado}` : ''
    ];
    const endereco = partes.join('').trim();
    const cep = pedido.cep ? ` CEP: ${pedido.cep}` : '';
    return (endereco || '-') + cep;
}

// Formatar comanda para impressão
// Gerar HTML da comanda para impressão
function gerarHTMLComanda(pedido) {
    const { data, hora } = formatarDataHora(pedido.data_pedido || pedido.data);
    const numeroPedido = String(pedido.idpedido).padStart(3, '0');
    const nomeCliente = pedido.nome_cliente || pedido.cliente || 'Cliente';
    const telefone = pedido.telefone_cliente || pedido.telefone || '-';
    const endereco = pedido.endereco_formatado || montarEnderecoPedido(pedido);
    const total = formatarPreco(pedido.totalPedido ?? pedido.valor_total ?? pedido.total ?? 0);
    
    let html = '<div class="comanda-impressao">';
    
    // Cabeçalho
    html += '<div class="comanda-header">';
    html += '<div class="comanda-titulo">JULAO\'S BURGER</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';
    
    // Informações do pedido
    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">PEDIDO #' + numeroPedido + '</div>';
    html += '<div>Data: ' + data + ' ' + hora + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';
    
    // Informações do cliente
    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">CLIENTE:</div>';
    html += '<div>' + nomeCliente + '</div>';
    html += '<div>Tel: ' + telefone + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';
    
    // Endereço
    html += '<div class="comanda-secao">';
    html += '<div class="comanda-secao-titulo">ENTREGA:</div>';
    html += '<div>' + endereco + '</div>';
    html += '<div class="comanda-linha"></div>';
    html += '</div>';
    
    // Itens do pedido
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
        
        // Opcionais
        if (Array.isArray(item.opcionais) && item.opcionais.length > 0) {
            html += '<div class="comanda-opcionais">Opcionais:</div>';
            item.opcionais.forEach(opcional => {
                const nomeOpcional = opcional.nome || '';
                const precoOpcional = opcional.preco > 0 ? ' (+R$ ' + formatarPreco(opcional.preco) + ')' : '';
                const qtdOpcional = opcional.quantidade > 1 ? ' x' + opcional.quantidade : '';
                html += '<div class="comanda-opcionais">- ' + nomeOpcional + qtdOpcional + precoOpcional + '</div>';
            });
        }
        
        // Observação do item
        if (item.observacao) {
            html += '<div class="comanda-observacao">Obs: ' + item.observacao + '</div>';
        }
        
        html += '</div>';
    });
    
    html += '<div class="comanda-linha"></div>';
    html += '</div>';
    
    // Total
    html += '<div class="comanda-total">TOTAL: R$ ' + total + '</div>';
    
    // Rodapé
    html += '<div class="comanda-linha"></div>';
    html += '<div class="comanda-rodape">Obrigado pela preferência!</div>';
    
    html += '</div>';
    
    return html;
}

// Imprimir comanda usando window.print()
async function imprimirComanda(pedido) {
    try {
        // Gerar HTML da comanda
        const htmlComanda = gerarHTMLComanda(pedido);
        
        // Obter área de impressão
        const areaImpressao = document.getElementById('areaImpressao');
        if (!areaImpressao) {
            console.error('Área de impressão não encontrada');
            return false;
        }
        
        // Limpar área anterior e adicionar HTML da comanda
        areaImpressao.innerHTML = htmlComanda;
        
        // Mostrar área de impressão temporariamente (será ocultada pelo CSS quando não estiver imprimindo)
        areaImpressao.style.display = 'block';
        
        // Aguardar um momento para renderizar
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Chamar impressão do navegador
        window.print();
        
        // Restaurar estado após impressão (usando evento beforeprint/afterprint se disponível)
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

// Buscar dados completos do pedido para impressão
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

// Verificar se o usuário é admin
function isAdmin() {
    try {
        const token = obterToken();
        if (!token) return false;
        
        // Decodificar token JWT (sem verificar assinatura, apenas para ler o payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.type === 'admin' || payload.type === 'adm';
    } catch (error) {
        console.error('Erro ao verificar se é admin:', error);
        return false;
    }
}

async function carregarPedidos() {
    try {
        const headers = headersAutenticados();
        if (!headers) return false;

        // Se for admin, usar rota de admin (que já filtra por data atual)
        // Se for usuário comum, usar rota normal
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
        pedidos = Array.isArray(pedidosApi)
            ? pedidosApi.map(p => {
                const statusConvertido = statusEntradaMap[(p.status || '').toLowerCase()] || (p.status || '').toLowerCase();
                return {
                    ...p,
                    status_original: p.status,
                    status: statusConvertido,
                    endereco_formatado: montarEnderecoPedido(p)
                };
            })
            : [];
        agruparPedidosPorStatus();
        renderizarColunas();
        return true;
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        ['pendente', 'aceito', 'preparo', 'entrega', 'concluido'].forEach(status => {
            const container = document.getElementById(`pedidos-${status}`);
            if (container) {
                container.innerHTML = '<div class="empty-status erro">Erro ao carregar pedidos</div>';
            }
        });
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
    atualizarResumo();
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

    const somAtivo = somHabilitado();
    if (somAtivo && pendentes > 0) {
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

    const texto = diffMin <= 0 ? 'Agora' : `${diffMin} min`;
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
        alert('Pedido não encontrado no painel atual.');
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

function somHabilitado() {
    const toggleSom = document.getElementById('toggleSomPedidos');
    return toggleSom ? toggleSom.checked : false;
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
    const toggleSom = document.getElementById('toggleSomPedidos');
    if (toggleSom) {
        const salvo = localStorage.getItem('painel_som_habilitado');
        if (salvo !== null) {
            toggleSom.checked = salvo === 'true';
        }
        toggleSom.addEventListener('change', () => {
            localStorage.setItem('painel_som_habilitado', toggleSom.checked ? 'true' : 'false');
            if (!toggleSom.checked) {
                pararSomPendentes();
            } else if ((pedidosAgrupadosPorStatus.pendente?.length ?? 0) > 0) {
                tocarSomPendentes();
            }
        });
    }

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
    card.draggable = true;
    card.dataset.pedidoId = String(pedido.idpedido);
    card.dataset.status = pedido.status;
    const textoPesquisa = [
        pedido.idpedido,
        pedido.nome_cliente,
        pedido.telefone_cliente,
        pedido.endereco_formatado,
        pedido.canal
    ].map(valor => (valor || '').toString().toLowerCase()).join(' ');
    card.dataset.search = textoPesquisa;

    const { data, hora } = formatarDataHora(pedido.data_pedido || pedido.data);
    const tempoInfo = calcularTempoDecorrido(pedido.data_pedido || pedido.data);
    const status = (pedido.status || '').toLowerCase();
    const total = formatarPreco(pedido.totalPedido ?? pedido.valor_total ?? pedido.total ?? 0);
    const canalBruto = pedido.tipo_entrega || pedido.canal || '';
    const canalHtml = canalBruto ? escapeHtml(canalBruto) : '';
    const endereco = escapeHtml(pedido.endereco_formatado || montarEnderecoPedido(pedido));
    const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : [];
    const mostrarProdutos = ['aceito', 'preparo'].includes(status);

    const pendenciaTag = status === 'pendente'
        ? `<span class="pedido-tag pendencia"><i class="fas fa-hourglass-half"></i> Aceite em até 5 min</span>`
        : '';
    const logisticaTag = status === 'entrega'
        ? `<span class="pedido-tag logistica"><i class="fas fa-motorcycle"></i> Em rota</span>`
        : '';
    const tagsHtml = [pendenciaTag, logisticaTag].filter(Boolean).join('');

        const itensHtml = itensPedido.slice(0, 3).map(item => {
            const nomeItem = escapeHtml(item.nome || item.produto_nome || 'Produto');
            const quantidade = item.quantidade ?? item.qtd ?? 1;
            const precoItem = formatarPreco(item.preco || item.preco_unitario || 0);
            const observacao = item.observacao ? `<div class="item-observacao-menor">${escapeHtml(item.observacao)}</div>` : '';
            const opcionais = Array.isArray(item.opcionais) && item.opcionais.length > 0
                ? `<ul class="item-opcionais">${item.opcionais.map(op =>
                    `<li>${escapeHtml(op.nome)}${op.preco > 0 ? ` (+R$ ${formatarPreco(op.preco)})` : ''}</li>`
                  ).join('')}</ul>`
                : '';
            return `
                <li>
                    <div class="item-row">
                        <span class="item-nome">${nomeItem}</span>
                        <span class="item-qtd">x${quantidade}</span>
                    </div>
                    <div class="item-meta">
                        <span class="item-preco">R$ ${precoItem}</span>
                    </div>
                    ${opcionais}
                    ${observacao}
                </li>
            `;
        }).join('');

    const itensRestantes = itensPedido.length > 3
        ? `<li class="item-extra">+${itensPedido.length - 3} item(s)</li>`
        : '';

    card.innerHTML = `
        <div class="pedido-card-header">
            <div class="pedido-identificacao">
                <span class="pedido-numero">#${String(pedido.idpedido).padStart(3, '0')}</span>
                ${canalHtml ? `<span class="pedido-canal">${canalHtml}</span>` : ''}
            </div>
            <span class="pedido-tempo ${tempoInfo.classe}">${tempoInfo.texto}</span>
        </div>

        <div class="pedido-info-grid">
            <div class="pedido-cliente">
                <strong>${escapeHtml(pedido.nome_cliente || pedido.cliente || 'Cliente')}</strong>
                <span>${escapeHtml(pedido.telefone_cliente || pedido.telefone || '-')}</span>
            </div>
            <div class="pedido-endereco">
                <i class="fas fa-location-dot"></i>
                <span>${endereco}</span>
            </div>
        </div>

        ${tagsHtml ? `<div class="pedido-tags">${tagsHtml}</div>` : ''}

        ${mostrarProdutos ? `
            <ul class="pedido-itens-lista">
                ${itensHtml}${itensRestantes}
            </ul>
        ` : `
            <div class="pedido-resumo">
                <div class="resumo-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${endereco}</span>
                </div>
            </div>
        `}

        <div class="pedido-footer">
            <div class="pedido-total">
                <strong>Total: R$ ${total}</strong>
                <span class="pedido-data">${data} • ${hora}</span>
            </div>
            <div class="pedido-actions">
                ${getBotoesAcao(status, pedido.idpedido)}
            </div>
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
        alert('Não foi possível atualizar o status do pedido.');
    }
}

async function cancelarPedido(id) {
    const pedidoId = Number(id);
    if (!Number.isFinite(pedidoId)) return;
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
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
            throw new Error('Erro ao cancelar pedido');
        }

        pedidos = pedidos.filter(p => p.idpedido !== pedidoId);
        agruparPedidosPorStatus();
        renderizarColunas();
    } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        alert('Não foi possível cancelar o pedido.');
    }
}

// Função para imprimir comanda manualmente
async function imprimirComandaManual(pedidoId) {
    try {
        // Buscar dados completos do pedido
            let pedidoParaImpressao = pedidos.find(p => p.idpedido === pedidoId);
            
            // Se não tiver dados completos, buscar da API
            if (!pedidoParaImpressao || !pedidoParaImpressao.itens || pedidoParaImpressao.itens.length === 0) {
                pedidoParaImpressao = await buscarPedidoCompleto(pedidoId);
            }
            
        if (!pedidoParaImpressao) {
            alert('Não foi possível carregar os dados do pedido para impressão.');
            return;
        }
        
                // Garantir que todas as informações necessárias estão presentes
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
                
                // Imprimir comanda
                await imprimirComanda(pedidoFormatado);
    } catch (error) {
        console.error('Erro ao imprimir comanda:', error);
        alert('Erro ao imprimir comanda. Tente novamente.');
    }
}

function getBotoesAcao(status, pedidoId) {
    let botoes = '';
    
    // Botão de detalhes sempre presente
    botoes += `
        <button class="action-btn btn-detalhes" onclick="abrirModalDetalhes(${pedidoId})">
            <i class="fas fa-eye"></i>
            Detalhes
        </button>
    `;
    
    // Botão de impressão sempre presente (exceto para pedidos cancelados)
    if (status !== 'cancelado') {
        botoes += `
            <button class="action-btn btn-imprimir" onclick="imprimirComandaManual(${pedidoId})" title="Imprimir Comanda">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
        `;
    }
    
    // Botões específicos por status
    switch(status) {
        case 'pendente':
            botoes += `
                <button class="action-btn btn-aceitar" onclick="atualizarStatus(${pedidoId}, 'aceito')">
                    <i class="fas fa-check"></i>
                    Aceitar
                </button>
                <button class="action-btn btn-cancelar" onclick="cancelarPedido(${pedidoId})">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
            `;
            break;
        case 'aceito':
            botoes += `
                <button class="action-btn btn-preparar" onclick="atualizarStatus(${pedidoId}, 'preparo')">
                    <i class="fas fa-play"></i>
                    Iniciar Preparo
                </button>
            `;
            break;
        case 'preparo':
            botoes += `
                <button class="action-btn btn-pronto" onclick="atualizarStatus(${pedidoId}, 'entrega')">
                    <i class="fas fa-check-circle"></i>
                    Pronto
                </button>
            `;
            break;
        case 'entrega':
            botoes += `
                <button class="action-btn btn-entregar" onclick="atualizarStatus(${pedidoId}, 'concluido')">
                    <i class="fas fa-truck"></i>
                    Entregar
                </button>
            `;
            break;
        case 'concluido':
            // Apenas detalhes e impressão
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
        const totalPedidoValor = Number(pedido.total ?? pedido.valor_total ?? 0);
        const endereco = pedido.endereco_formatado || montarEnderecoPedido(pedido);

        const itensPedido = Array.isArray(pedido.itens) ? pedido.itens : [];
        const itensDetalhesHtml = itensPedido.map(item => {
            const nomeItem = item.nome || item.produto_nome || 'Produto';
            const quantidade = item.quantidade ?? item.qtd ?? 1;
            const precoUnitario = Number(item.preco || 0);
            const totalItem = Number(item.totalItem ?? (precoUnitario * quantidade));
            const observacao = item.observacao ? `<p class="item-observacao-detalhe"><strong>Observação:</strong> ${escapeHtml(item.observacao)}</p>` : '';
            const opcionaisHtml = (item.opcionais || []).map(opcional => `
                <li>${escapeHtml(opcional.nome)} ${opcional.preco > 0 ? `(+R$ ${formatarPreco(opcional.preco)})` : ''}</li>
            `).join('');

            return `
                <div class="item-detalhes">
                    <div class="item-info">
                        <h5>${escapeHtml(nomeItem)}</h5>
                        <p><strong>Quantidade:</strong> ${quantidade}</p>
                        <p><strong>Preço unitário:</strong> R$ ${formatarPreco(precoUnitario)}</p>
                        ${opcionaisHtml ? `<p><strong>Opcionais:</strong></p><ul>${opcionaisHtml}</ul>` : ''}
                        ${observacao}
                    </div>
                    <div class="item-preco-detalhes">
                        R$ ${formatarPreco(totalItem)}
                    </div>
                </div>
            `;
        }).join('');

        modalBody.innerHTML = `
            <div class="pedido-detalhes">
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

// Drag and Drop functionality
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}


// Adicionar eventos de drop nas colunas de status
document.addEventListener('DOMContentLoaded', function() {
    registrarControlesPainel();

    const statusColumns = document.querySelectorAll('.board-column');
    statusColumns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        const body = column.querySelector('.board-column-body');
        if (body) {
            body.addEventListener('dragover', handleDragOver);
            body.addEventListener('drop', handleDrop);
        }
    });

    carregarPedidos().then(() => {
        ultimoTotalPendentes = pedidosAgrupadosPorStatus.pendente?.length ?? 0;
        if (somHabilitado() && ultimoTotalPendentes > 0) {
            tocarSomPendentes();
        }
    });
    
});

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    
    if (draggedElement) {
        const coluna = e.currentTarget.classList.contains('board-column')
            ? e.currentTarget
            : e.currentTarget.closest('.board-column');
        if (!coluna) return;

        const novoStatus = coluna.dataset.status;
        const pedidoId = Number(draggedElement.dataset.pedidoId);
        
        atualizarStatus(pedidoId, novoStatus);
    }
}