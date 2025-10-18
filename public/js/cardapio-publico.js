// Cardápio Público - Julão's Burger
// JavaScript para carregamento dinâmico de produtos

// Variáveis globais
let cardapioData = null;
let categoriaAtiva = null;
let produtosExibidos = [];

// Elementos DOM
const categoriesNav = document.getElementById('categoriesNav');
const categoryTabs = document.getElementById('categoryTabs');
const productsGrid = document.getElementById('productsGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    inicializarCardapio();
    configurarEventListeners();
});

// Função principal de inicialização

// Carregar dados do cardápio
async function carregarCardapio() {
    try {
        const response = await fetch('/api/cardapio/mostrarCardapio');
        if (!response.ok) {
            throw new Error('Erro ao carregar cardápio');
        }
        cardapioData = await response.json();
        
        // Filtrar apenas produtos ativos
        if (cardapioData.categorias) {
            cardapioData.categorias = cardapioData.categorias.map(categoria => ({
                ...categoria,
                produtos: (categoria.produtos || []).filter(produto => !produto.excluido)
            }));
        }
    } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
        throw error;
    }
}

// Renderizar categorias na navegação
async function renderizarCategorias() {
    if (!cardapioData || !cardapioData.categorias) {
        return;
    }

    // Buscar todos os produtos primeiro
    const todosProdutos = await buscarTodosProdutos();
    
    // Organizar produtos por categoria
    const categoriasComProdutos = organizarProdutosPorCategoria(cardapioData.categorias, todosProdutos);
    
    // Filtrar apenas categorias que têm produtos
    const categoriasAtivas = categoriasComProdutos.filter(cat => 
        cat.produtos && cat.produtos.length > 0
    );

    // Renderizar tabs como âncoras
    categoryTabs.innerHTML = '';
    categoriasAtivas.forEach(categoria => {
        const tab = document.createElement('a');
        tab.className = 'category-tab';
        tab.textContent = categoria.nome;
        tab.href = `#categoria-${categoria.idcategoria}`;
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            scrollParaCategoria(categoria.idcategoria);
        });
        categoryTabs.appendChild(tab);
    });

    // Renderizar todo o cardápio
    renderizarCardapioCompleto(categoriasAtivas);
}

// Buscar todos os produtos
async function buscarTodosProdutos() {
    try {
        const response = await fetch('/api/produtos');
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Erro ao buscar todos os produtos:', error);
        return [];
    }
}

// Organizar produtos por categoria
function organizarProdutosPorCategoria(categorias, produtos) {
    return categorias.map(categoria => ({
        ...categoria,
        produtos: produtos.filter(produto => 
            produto.idcategoria === categoria.idcategoria
        )
    }));
}

// Renderizar cardápio completo com todas as categorias
async function renderizarCardapioCompleto(categorias) {
    mostrarLoading();
    
    let htmlCompleto = '';
    
    for (const categoria of categorias) {
        // Header da categoria
        htmlCompleto += `
            <div class="categoria-section" id="categoria-${categoria.idcategoria}">
                <div class="categoria-header">
                    <h2 class="categoria-titulo">${categoria.nome}</h2>
                </div>
                <div class="categoria-produtos" id="produtos-categoria-${categoria.idcategoria}">
                    <div class="loading-categoria">Carregando produtos...</div>
                </div>
            </div>
        `;
    }
    
    if (productsGrid) {
        productsGrid.innerHTML = htmlCompleto;
    }
    
    // Renderizar produtos para cada categoria (já organizados)
    for (const categoria of categorias) {
        try {
            await renderizarProdutosCategoria(categoria.idcategoria, categoria.produtos);
        } catch (error) {
            console.error(`Erro ao renderizar produtos da categoria ${categoria.nome}:`, error);
            document.getElementById(`produtos-categoria-${categoria.idcategoria}`).innerHTML = 
                '<p class="erro-categoria">Erro ao carregar produtos desta categoria.</p>';
        }
    }
    
    ocultarLoading();
}

// Renderizar produtos de uma categoria específica
async function renderizarProdutosCategoria(idcategoria, produtos) {
    const container = document.getElementById(`produtos-categoria-${idcategoria}`);
    if (!container) {
        return;
    }
    
    const produtosAtivos = produtos.filter(produto => produto.ativo && !produto.excluido);
    
    if (produtosAtivos.length === 0) {
        container.innerHTML = '<p class="sem-produtos">Nenhum produto disponível nesta categoria.</p>';
        return;
    }
    
    // Criar grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'products-grid';
    
    // Adicionar produtos ao grid
    for (const produto of produtosAtivos) {
        const card = await criarCardProduto(produto);
        gridContainer.appendChild(card);
    }
    
    // Substituir conteúdo do container
    container.innerHTML = '';
    container.appendChild(gridContainer);
}

// Função para scroll suave para uma categoria
function scrollParaCategoria(idcategoria) {
    const elemento = document.getElementById(`categoria-${idcategoria}`);
    if (elemento) {
        elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Selecionar categoria (mantida para compatibilidade)
async function selecionarCategoria(categoria) {
    categoriaAtiva = categoria;
    produtosExibidos = categoria.produtos || [];
    
    // Atualizar estados ativos
    atualizarCategoriaAtiva(categoria.idcategoria);
    
    // Renderizar produtos
    await renderizarProdutos();
    
    // Scroll suave para a seção de produtos
    productsContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Atualizar categoria ativa na interface
function atualizarCategoriaAtiva(categoriaId) {
    // Remover classe active de todas as categorias
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active na categoria selecionada (se existir)
    const elementoAtivo = document.querySelector(`[data-categoria-id="${categoriaId}"]`);
    if (elementoAtivo) {
        elementoAtivo.classList.add('active');
    }
}

// Renderizar produtos
async function renderizarProdutos() {
    if (!produtosExibidos || produtosExibidos.length === 0) {
        mostrarEstadoVazio();
        return;
    }

    esconderEstados();
    
    productsGrid.innerHTML = '';
    productsGrid.style.display = 'grid';
    
    // Criar cards de forma assíncrona
    for (const produto of produtosExibidos) {
        const productCard = await criarCardProduto(produto);
        productsGrid.appendChild(productCard);
    }
}

// Criar card do produto
async function criarCardProduto(produto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.produtoId = produto.idproduto;
    
    const preco = formatarPreco(produto.preco);
    const imagem = produto.imagem ? 
        (produto.imagem.startsWith('/imgs/') ? produto.imagem : `/imgs/${produto.imagem}`) : 
        null;
    
    // Não carregar opcionais nos cards - apenas no modal
    
    card.innerHTML = `
        <div class="product-content">
            <div class="product-header">
                <h3 class="product-title">${produto.nome}</h3>
                <span class="product-price">R$ ${preco}</span>
            </div>
            
            <div class="product-description">
                ${produto.descricao || 'Sem descrição disponível.'}
            </div>
            
            <div class="product-image">
                ${imagem ? 
                    `<img src="${imagem}" alt="${produto.nome}" loading="lazy">` :
                    `<div class="product-image-placeholder">
                        <i class="fas fa-utensils"></i>
                        <span>Sem imagem</span>
                    </div>`
                }
            </div>
            
            <div class="product-actions">
                <button class="btn-add-to-cart" onclick="abrirModalProduto(${JSON.stringify(produto).replace(/"/g, '&quot;')}, event)">
                    <i class="fas fa-shopping-cart"></i>
                    Ver Detalhes
                </button>
            </div>
        </div>
    `;
    
    // Event listener para abrir modal (imagem e título)
    const imageElement = card.querySelector('.product-image');
    const titleElement = card.querySelector('.product-title');
    
    if (imageElement) {
        imageElement.addEventListener('click', () => abrirModalProduto(produto));
    }
    if (titleElement) {
        titleElement.addEventListener('click', () => abrirModalProduto(produto));
    }
    
    return card;
}

// Abrir modal do produto
async function abrirModalProduto(produto) {
    const preco = formatarPreco(produto.preco);
    const imagem = produto.imagem ? 
        (produto.imagem.startsWith('/imgs/') ? produto.imagem : `/imgs/${produto.imagem}`) : 
        null;
    
    // Carregar grupos de opcionais do produto
    let gruposOpcionais = [];
    try {
        const response = await fetch(`/api/produtos/${produto.idproduto}/grupos-opcionais`);
        if (response.ok) {
            gruposOpcionais = await response.json();
        }
    } catch (error) {
        console.error('Erro ao carregar grupos de opcionais:', error);
    }
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-product-image">
                ${imagem ? 
                    `<img src="${imagem}" alt="${produto.nome}">` :
                    `<div class="product-image-placeholder">
                        <i class="fas fa-utensils"></i>
                        <span>Sem imagem</span>
                    </div>`
                }
            </div>
            
            <div class="modal-product-info">
                <h2 class="modal-product-title">${produto.nome}</h2>
                <div class="modal-product-price" id="modalPrecoBase">R$ ${preco}</div>
                <div class="modal-product-description">
                    ${produto.descricao || 'Sem descrição disponível.'}
                </div>
                
                <!-- Seção de Grupos de Opcionais -->
                <div id="opcionaisSection" class="opcionais-section" ${gruposOpcionais.length === 0 ? 'style="display: none;"' : ''}>
                    <h3>Personalize seu pedido</h3>
                    <div id="gruposOpcionaisContainer"></div>
                </div>
                
                <!-- Preço Total Atualizado -->
                <div id="precoTotalContainer" class="preco-total-container" ${gruposOpcionais.length === 0 ? 'style="display: none;"' : ''}>
                    <div class="preco-base">
                        <span>Preço base:</span>
                        <span id="precoBase">R$ ${preco}</span>
                    </div>
                    <div class="opcionais-adicionais">
                        <span>Extras:</span>
                        <span id="precoOpcionais">R$ 0,00</span>
                    </div>
                    <div class="preco-final">
                        <span>Total:</span>
                        <span id="precoFinal" class="price">R$ ${preco}</span>
                    </div>
                </div>
                
                <div class="modal-product-actions">
                    <button class="btn-add-to-cart" onclick="adicionarAoCarrinhoComOpcionais(${produto.idproduto})">
                        <i class="fas fa-shopping-cart"></i>
                        Adicionar ao Carrinho
                    </button>
                    <button class="btn-favorite" onclick="adicionarAosFavoritos(${produto.idproduto})">
                        <i class="fas fa-heart"></i>
                        Favoritar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Renderizar grupos de opcionais se existirem
    if (gruposOpcionais.length > 0) {
        renderizarGruposOpcionais(gruposOpcionais);
        inicializarCalculadoraPreco(produto.preco);
        
        // Validar estado inicial do botão após renderizar
        setTimeout(() => {
            inicializarEstadoGrupos();
            atualizarBotaoCarrinho();
        }, 100);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fechar modal
function fecharModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Renderizar grupos de opcionais no modal
function renderizarGruposOpcionais(gruposOpcionais) {
    const gruposContainer = document.getElementById('gruposOpcionaisContainer');
    
    gruposContainer.innerHTML = gruposOpcionais.map(grupo => `
        <div class="modal-opcionais-group-container ${grupo.obrigatorio ? 'obrigatorio' : ''}" 
             data-grupo="${grupo.idgrupo_opcional}" 
             data-minimo="${grupo.minimo_escolhas || 0}"
             data-maximo="${grupo.maximo_escolhas || ''}">
            <div class="modal-opcionais-header">
                <h4>${grupo.nome_exibicao || grupo.grupo_nome}</h4>
                ${grupo.obrigatorio ? '<span class="obrigatorio-tag">Obrigatório</span>' : ''}
            </div>
            ${grupo.instrucoes ? `<p class="modal-grupo-instrucoes">${grupo.instrucoes}</p>` : ''}
            <div class="modal-opcionais-list">
                ${grupo.opcionais.map(opcional => `
                    <div class="modal-opcional-item ${grupo.obrigatorio ? 'obrigatorio' : ''}" 
                         data-grupo="${grupo.idgrupo_opcional}" 
                         data-maximo="${grupo.maximo_escolhas || ''}"
                         data-minimo="${grupo.minimo_escolhas || 0}">
                        <div class="modal-opcional-info">
                            <span class="modal-opcional-nome">${opcional.nome}</span>
                            ${opcional.preco > 0 ? `<span class="modal-opcional-preco">+ R$ ${formatarPreco(opcional.preco)}</span>` : ''}
                        </div>
                        <div class="modal-quantity-selector">
                            <button class="modal-qty-btn minus" onclick="alterarQuantidadeModal(${opcional.idopcional}, -1, event)">-</button>
                            <span class="modal-qty-value" id="modal_qty_${opcional.idopcional}" data-preco="${opcional.preco}" data-tipo="${opcional.tipo}">0</span>
                            <button class="modal-qty-btn plus" onclick="alterarQuantidadeModal(${opcional.idopcional}, 1, event)">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Inicializar calculadora de preço
function inicializarCalculadoraPreco(precoBase) {
    window.precoBaseProduto = parseFloat(precoBase);
    window.opcionaisSelecionados = [];
}

// Inicializar estado visual dos grupos
function inicializarEstadoGrupos() {
    const gruposObrigatorios = document.querySelectorAll('.modal-opcionais-group-container.obrigatorio');
    
    gruposObrigatorios.forEach(grupoContainer => {
        const grupoId = grupoContainer.dataset.grupo;
        const minimo = parseInt(grupoContainer.dataset.minimo) || 0;
        
        if (minimo > 0) {
            verificarMinimoGrupoModal(grupoId, minimo);
        }
    });
}

// Atualizar preço baseado nos opcionais selecionados no modal
function atualizarPrecoModal() {
    let precoOpcionais = 0;
    const opcionaisSelecionados = [];
    
    // Calcular preço dos seletores de quantidade (agora todos os opcionais)
    const qtyElements = document.querySelectorAll('.modal-qty-value');
    
    qtyElements.forEach(qtyElement => {
        const quantidade = parseInt(qtyElement.textContent) || 0;
        if (quantidade > 0) {
            const opcionalId = qtyElement.id.replace('modal_qty_', '');
            const preco = parseFloat(qtyElement.dataset.preco) || 0;
            const tipo = qtyElement.dataset.tipo;
            
            if (tipo === 'adicionar') {
                precoOpcionais += preco * quantidade;
            }
            
            opcionaisSelecionados.push({
                id: opcionalId,
                tipo: tipo,
                preco: preco,
                quantidade: quantidade
            });
        }
    });
    
    const precoTotal = window.precoBaseProduto + precoOpcionais;
    
    // Atualizar elementos do preço
    const precoOpcionaisElement = document.getElementById('precoOpcionais');
    const precoFinalElement = document.getElementById('precoFinal');
    
    if (precoOpcionaisElement) {
        precoOpcionaisElement.textContent = `R$ ${formatarPreco(precoOpcionais)}`;
    }
    
    if (precoFinalElement) {
        precoFinalElement.textContent = `R$ ${formatarPreco(precoTotal)}`;
    }
    
    // Armazenar opcionais selecionados globalmente
    window.opcionaisSelecionados = opcionaisSelecionados;
    
    // Atualizar estado do botão do carrinho
    atualizarBotaoCarrinho();
}

// Alterar quantidade no modal
function alterarQuantidadeModal(idopcional, delta, event) {
    event.stopPropagation();
    
    const qtyElement = document.getElementById(`modal_qty_${idopcional}`);
    const currentQty = parseInt(qtyElement.textContent) || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    // Obter informações do grupo
    const container = event.target.closest('.modal-opcional-item');
    const grupoId = container.dataset.grupo;
    const maximo = parseInt(container.dataset.maximo) || 999;
    const minimo = parseInt(container.dataset.minimo) || 0;
    
    // Verificar limite máximo do grupo
    const totalSelecionado = calcularTotalSelecionadoGrupoModal(grupoId);
    if (delta > 0 && totalSelecionado >= maximo) {
        return; // Não permitir exceder o máximo
    }
    
    qtyElement.textContent = newQty;
    
    // Atualizar estado visual dos botões
    const minusBtn = container.querySelector('.modal-qty-btn.minus');
    const plusBtn = container.querySelector('.modal-qty-btn.plus');
    
    minusBtn.disabled = newQty === 0;
    plusBtn.disabled = totalSelecionado >= maximo;
    
    // Adicionar/remover classe de selecionado
    if (newQty > 0) {
        container.classList.add('selected');
    } else {
        container.classList.remove('selected');
    }
    
    // Verificar se atende o mínimo obrigatório (apenas para grupos obrigatórios)
    const grupoContainer = document.querySelector(`[data-grupo="${grupoId}"].modal-opcionais-group-container`);
    if (grupoContainer && grupoContainer.classList.contains('obrigatorio')) {
        verificarMinimoGrupoModal(grupoId, minimo);
    }
    
    // Atualizar preço
    atualizarPrecoModal();
    
    // Atualizar estado do botão do carrinho
    atualizarBotaoCarrinho();
    
}

// Calcular total selecionado em um grupo no modal
function calcularTotalSelecionadoGrupoModal(grupoId) {
    const opcionaisDoGrupo = document.querySelectorAll(`.modal-opcionais-list [data-grupo="${grupoId}"]`);
    let total = 0;
    
    opcionaisDoGrupo.forEach(opcional => {
        const qtyElement = opcional.querySelector('.modal-qty-value');
        if (qtyElement) {
            total += parseInt(qtyElement.textContent) || 0;
        }
    });
    
    return total;
}

// Verificar se atende o mínimo obrigatório do grupo no modal
function verificarMinimoGrupoModal(grupoId, minimo) {
    const totalSelecionado = calcularTotalSelecionadoGrupoModal(grupoId);
    const grupoContainer = document.querySelector(`[data-grupo="${grupoId}"].modal-opcionais-group-container`);
    
    if (!grupoContainer) return;
    
    // Remover classes anteriores
    grupoContainer.classList.remove('minimo-nao-atendido', 'minimo-atendido');
    
    if (totalSelecionado < minimo) {
        grupoContainer.classList.add('minimo-nao-atendido');
    } else if (totalSelecionado >= minimo) {
        grupoContainer.classList.add('minimo-atendido');
    }
}

// Validar se todos os grupos obrigatórios atendem os mínimos
function validarGruposObrigatorios() {
    const gruposObrigatorios = document.querySelectorAll('.modal-opcionais-group-container.obrigatorio');
    let todosValidos = true;
    const gruposInvalidos = [];
    
    gruposObrigatorios.forEach(grupoContainer => {
        const header = grupoContainer.querySelector('.modal-opcionais-header h4');
        const minimo = parseInt(grupoContainer.dataset.minimo) || 0;
        const grupoId = grupoContainer.dataset.grupo;
        const nomeGrupo = header ? header.textContent.trim() : 'Grupo';
        
        if (minimo > 0) {
            const totalSelecionado = calcularTotalSelecionadoGrupoModal(grupoId);
            
            if (totalSelecionado < minimo) {
                todosValidos = false;
                gruposInvalidos.push({
                    nome: nomeGrupo,
                    minimo: minimo,
                    selecionado: totalSelecionado
                });
            }
        }
    });
    
    return {
        valido: todosValidos,
        gruposInvalidos: gruposInvalidos
    };
}

// Atualizar estado do botão "Adicionar ao Carrinho"
function atualizarBotaoCarrinho() {
    const validacao = validarGruposObrigatorios();
    const botaoCarrinho = document.getElementById('btnAdicionarCarrinho');
    
    if (!botaoCarrinho) return;
    
    if (validacao.valido) {
        // Todos os mínimos foram atendidos
        botaoCarrinho.disabled = false;
        botaoCarrinho.classList.remove('btn-disabled');
        botaoCarrinho.classList.add('btn-enabled');
        botaoCarrinho.textContent = 'Adicionar ao Carrinho';
        
        // Remover mensagem de erro se existir
        const mensagemErro = document.getElementById('mensagemValidacao');
        if (mensagemErro) {
            mensagemErro.remove();
        }
    } else {
        // Alguns mínimos não foram atendidos
        botaoCarrinho.disabled = true;
        botaoCarrinho.classList.remove('btn-enabled');
        botaoCarrinho.classList.add('btn-disabled');
        botaoCarrinho.textContent = 'Selecione os itens obrigatórios';
        
        // Mostrar mensagem de erro
        mostrarMensagemValidacao(validacao.gruposInvalidos);
    }
}

// Mostrar mensagem de validação
function mostrarMensagemValidacao(gruposInvalidos) {
    // Remover mensagem anterior se existir
    const mensagemAnterior = document.getElementById('mensagemValidacao');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Criar nova mensagem
    const mensagemDiv = document.createElement('div');
    mensagemDiv.id = 'mensagemValidacao';
    mensagemDiv.className = 'mensagem-validacao-erro';
    
    let mensagemTexto = '⚠️ Selecione pelo menos: ';
    const requisitos = gruposInvalidos.map(grupo => 
        `${grupo.minimo} item(s) em "${grupo.nome}"`
    );
    mensagemTexto += requisitos.join(', ');
    
    mensagemDiv.innerHTML = `
        <div class="mensagem-conteudo">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${mensagemTexto}</span>
        </div>
    `;
    
    // Inserir antes do botão
    const containerBotoes = document.querySelector('.modal-buttons');
    if (containerBotoes) {
        containerBotoes.insertBefore(mensagemDiv, containerBotoes.firstChild);
    }
}

// ==================== SISTEMA DE CARRINHO ====================

// Estrutura do carrinho (armazenada no localStorage)
let carrinho = [];

// Inicializar carrinho do localStorage
function inicializarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('julaosBurger_carrinho');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            carrinho = [];
        }
    }
    atualizarCarrinho();
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('julaosBurger_carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
}

// Adicionar ao carrinho com opcionais
function adicionarAoCarrinhoComOpcionais(idproduto) {
    const validacao = validarGruposObrigatorios();
    
    // Verificar se todos os mínimos obrigatórios foram atendidos
    if (!validacao.valido) {
        mostrarMensagemValidacao(validacao.gruposInvalidos);
        return;
    }
    
    const opcionaisSelecionados = window.opcionaisSelecionados || [];
    
    // Obter informações do produto
    const produtoNome = document.querySelector('.modal-product-title').textContent;
    const precoBaseElement = document.getElementById('precoBase');
    const precoFinalElement = document.getElementById('precoFinal');
    
    // Extrair valores numéricos dos preços
    const precoBase = precoBaseElement ? 
        parseFloat(precoBaseElement.textContent.replace('R$', '').replace(',', '.').trim()) : 
        window.precoBaseProduto;
    
    const precoFinal = precoFinalElement ? 
        parseFloat(precoFinalElement.textContent.replace('R$', '').replace(',', '.').trim()) : 
        window.precoBaseProduto;
    
    // Obter imagem do produto
    const imagemElement = document.querySelector('.modal-product-image img');
    const imagemProduto = imagemElement ? imagemElement.src : null;
    
    // Criar item do carrinho
    const itemCarrinho = {
        id: Date.now(), // ID único para o item
        produtoId: idproduto,
        nome: produtoNome,
        precoBase: precoBase,
        precoFinal: precoFinal,
        quantidade: 1,
        opcionais: opcionaisSelecionados.map(opcional => ({
            id: opcional.id,
            tipo: opcional.tipo,
            preco: opcional.preco,
            quantidade: opcional.quantidade,
            nome: obterNomeOpcional(opcional.id)
        })),
        imagem: imagemProduto
    };
    
    // Adicionar ao carrinho
    carrinho.push(itemCarrinho);
    salvarCarrinho();
    
    // Mostrar feedback visual
    mostrarNotificacaoCarrinho(produtoNome);
    
    // Fechar modal
    fecharModal();
}

// Obter nome do opcional
function obterNomeOpcional(opcionalId) {
    const opcionalElement = document.querySelector(`#modal_qty_${opcionalId}`);
    if (opcionalElement) {
        const container = opcionalElement.closest('.modal-opcional-item');
        const nomeElement = container.querySelector('.modal-opcional-nome');
        return nomeElement ? nomeElement.textContent : 'Opcional';
    }
    return 'Opcional';
}

// Mostrar notificação ao adicionar item
function mostrarNotificacaoCarrinho(nomeProduto) {
    // Criar notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'cart-notification';
    notificacao.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${nomeProduto} adicionado ao carrinho!</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Animar entrada
    setTimeout(() => {
        notificacao.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    }, 3000);
}

// Atualizar exibição do carrinho
function atualizarCarrinho() {
    const cartItems = document.querySelector('.cart-items');
    const cartFooter = document.querySelector('.cart-footer');
    
    if (!cartItems) return;
    
    // Atualizar badge do carrinho
    atualizarBadgeCarrinho();
    
    // Se carrinho vazio
    if (carrinho.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
                <small>Adicione produtos para começar seu pedido!</small>
            </div>
        `;
        
        if (cartFooter) {
            cartFooter.innerHTML = `
                <div class="cart-total">
                    <span>Total:</span>
                    <span class="total-value">R$ 0,00</span>
                </div>
                <button class="btn-checkout" disabled>Finalizar Compra</button>
            `;
        }
        return;
    }
    
    // Renderizar itens do carrinho
    let htmlItens = '';
    carrinho.forEach((item, index) => {
        htmlItens += `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-image">
                    ${item.imagem ? 
                        `<img src="${item.imagem}" alt="${item.nome}">` :
                        `<i class="fas fa-utensils"></i>`
                    }
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.nome}</h4>
                    ${item.opcionais && item.opcionais.length > 0 ? `
                        <div class="cart-item-opcionais">
                            ${item.opcionais.map(op => `
                                <small>${op.quantidade}x ${op.nome}${op.preco > 0 ? ` (+R$ ${formatarPreco(op.preco)})` : ''}</small>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="cart-item-price">R$ ${formatarPreco(item.precoFinal)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity-selector">
                        <button class="cart-qty-btn minus" onclick="alterarQuantidadeCarrinho(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="cart-qty-value">${item.quantidade}</span>
                        <button class="cart-qty-btn plus" onclick="alterarQuantidadeCarrinho(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="cart-remove-btn" onclick="removerItemCarrinho(${item.id})" title="Remover item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = htmlItens;
    
    // Calcular e exibir total
    const total = calcularTotalCarrinho();
    
    if (cartFooter) {
        cartFooter.innerHTML = `
            <div class="cart-summary">
                <div class="cart-subtotal">
                    <span>Subtotal:</span>
                    <span>R$ ${formatarPreco(total)}</span>
                </div>
                ${total >= 200 ? `
                    <div class="cart-free-delivery">
                        <i class="fas fa-truck"></i>
                        <span>Entrega Grátis!</span>
                    </div>
                ` : `
                    <div class="cart-delivery-info">
                        <small>Faltam R$ ${formatarPreco(200 - total)} para entrega grátis</small>
                    </div>
                `}
                <div class="cart-total">
                    <span>Total:</span>
                    <span class="total-value">R$ ${formatarPreco(total)}</span>
                </div>
            </div>
            <button class="btn-checkout" onclick="finalizarCompra()">
                <i class="fas fa-check"></i>
                Finalizar Compra
            </button>
            <button class="btn-clear-cart" onclick="limparCarrinho()">
                <i class="fas fa-trash"></i>
                Limpar Carrinho
            </button>
        `;
    }
}

// Atualizar badge do carrinho
function atualizarBadgeCarrinho() {
    const cartBtn = document.getElementById('openCart');
    if (!cartBtn) return;
    
    // Remover badge existente
    const badgeExistente = cartBtn.querySelector('.cart-badge');
    if (badgeExistente) {
        badgeExistente.remove();
    }
    
    // Calcular total de itens
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    // Adicionar badge se houver itens
    if (totalItens > 0) {
        const badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.textContent = totalItens;
        cartBtn.appendChild(badge);
    }
}

// Alterar quantidade de item no carrinho
function alterarQuantidadeCarrinho(itemId, delta) {
    const itemIndex = carrinho.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        carrinho[itemIndex].quantidade += delta;
        
        // Remover item se quantidade for 0
        if (carrinho[itemIndex].quantidade <= 0) {
            carrinho.splice(itemIndex, 1);
        }
        
        salvarCarrinho();
    }
}

// Remover item do carrinho
function removerItemCarrinho(itemId) {
    const itemIndex = carrinho.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        const item = carrinho[itemIndex];
        
        // Confirmar remoção
        if (confirm(`Deseja remover "${item.nome}" do carrinho?`)) {
            carrinho.splice(itemIndex, 1);
            salvarCarrinho();
        }
    }
}

// Limpar carrinho
function limparCarrinho() {
    if (carrinho.length === 0) return;
    
    if (confirm('Deseja limpar todos os itens do carrinho?')) {
        carrinho = [];
        salvarCarrinho();
    }
}

// Calcular total do carrinho
function calcularTotalCarrinho() {
    return carrinho.reduce((total, item) => {
        return total + (item.precoFinal * item.quantidade);
    }, 0);
}

// Finalizar compra
function finalizarCompra() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    const total = calcularTotalCarrinho();
    
    // Verificar pedido mínimo
    if (total < 25) {
        alert(`O pedido mínimo é de R$ 25,00. Adicione mais R$ ${formatarPreco(25 - total)} ao carrinho.`);
        return;
    }
    
    // Aqui você pode implementar a lógica de finalização
    // Por exemplo, redirecionar para página de checkout ou abrir modal de pedido
    
    alert(`Pedido de R$ ${formatarPreco(total)} pronto para finalização!\n\nEm breve você será redirecionado para a página de checkout.`);
    
    // TODO: Implementar integração com sistema de pedidos
}

// Inicializar carrinho ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    inicializarCarrinho();
});


// Funções de estado
function mostrarLoading() {
    if (loadingState) {
        loadingState.style.display = 'block';
    }
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    if (productsGrid) {
        productsGrid.style.display = 'none';
    }
}

function esconderLoading() {
    loadingState.style.display = 'none';
}

function ocultarLoading() {
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Mostrar o productsGrid
    if (productsGrid) {
        productsGrid.style.display = 'block';
    }
}

function mostrarEstadoVazio() {
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    productsGrid.style.display = 'none';
}

function esconderEstados() {
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
}

function mostrarErro(mensagem) {
    esconderLoading();
    emptyState.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro</h3>
        <p>${mensagem}</p>
        <button onclick="inicializarCardapio()" class="btn-retry">
            <i class="fas fa-refresh"></i>
            Tentar Novamente
        </button>
    `;
    emptyState.style.display = 'block';
}

// Configurar event listeners
function configurarEventListeners() {
    // Fechar modal
    if (closeModal) {
        closeModal.addEventListener('click', fecharModal);
    }
    
    // Fechar modal clicando fora
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModal();
            }
        });
    }
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            fecharModal();
        }
    });
    
    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = href && href !== '#' && href.length > 1 ? document.querySelector(href) : null;
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Funções auxiliares
function formatarPreco(preco) {
    if (typeof preco === 'number') {
        return preco.toFixed(2);
    }
    if (typeof preco === 'string') {
        // Remover vírgulas e converter para número
        const precoNumerico = parseFloat(preco.replace(',', '.'));
        if (!isNaN(precoNumerico)) {
            return precoNumerico.toFixed(2);
        }
    }
    return '0.00';
}

// Funções de interação (placeholder para futuras implementações)
function adicionarAoCarrinho(produtoId) {
    // TODO: Implementar funcionalidade de carrinho
    alert(`Produto ${produtoId} adicionado ao carrinho!`);
}

function adicionarAosFavoritos(produtoId) {
    // TODO: Implementar funcionalidade de favoritos
    alert(`Produto ${produtoId} adicionado aos favoritos!`);
}

// Função de busca (placeholder)
async function buscarProdutos(termo) {
    if (!cardapioData || !termo) {
        return;
    }
    
    const termoLower = termo.toLowerCase();
    const produtosEncontrados = [];
    
    cardapioData.categorias.forEach(categoria => {
        if (categoria.produtos) {
            categoria.produtos.forEach(produto => {
                if (produto.nome.toLowerCase().includes(termoLower) ||
                    produto.descricao.toLowerCase().includes(termoLower)) {
                    produtosEncontrados.push(produto);
                }
            });
        }
    });
    
    if (produtosEncontrados.length > 0) {
        categoriaAtiva = { nome: `Resultados para "${termo}"`, idcategoria: 'search' };
        produtosExibidos = produtosEncontrados;
        await renderizarProdutos();
    } else {
        mostrarEstadoVazio();
    }
}

// Função para atualizar status do restaurante
function atualizarStatusRestaurante() {
    const agora = new Date();
    const hora = agora.getHours();
    const statusElement = document.getElementById('statusIndicator');
    
    // Simular horário de funcionamento (8h às 22h)
    const aberto = hora >= 8 && hora < 22;
    
    if (statusElement) {
        statusElement.textContent = aberto ? 'Aberto' : 'Fechado';
        statusElement.className = `status-indicator ${aberto ? '' : 'fechado'}`;
    }
}

// Atualizar status ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    atualizarStatusRestaurante();
    
    // Atualizar status a cada minuto
    setInterval(atualizarStatusRestaurante, 60000);
});

// Função para lidar com mudanças de orientação da tela
function lidarComMudancaOrientacao() {
    // Recarregar layout se necessário
    setTimeout(() => {
        // Layout sem aside - sem necessidade de ajustes
    }, 100);
}

window.addEventListener('orientationchange', lidarComMudancaOrientacao);
window.addEventListener('resize', lidarComMudancaOrientacao);

// Função para lazy loading de imagens
function configurarLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Configurar lazy loading quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', configurarLazyLoading);

// Função para executar busca inline
function executarBuscaInline() {
    const searchInput = document.getElementById('searchInputInline');
    if (!searchInput) return;
    
    const termo = searchInput.value.trim();
    
    if (termo.length === 0) {
        mostrarEstadoVazioInline();
        return;
    }
    
    // Buscar produtos
    const produtosEncontrados = buscarProdutosInterno(termo);
    
    if (produtosEncontrados.length === 0) {
        mostrarEstadoNenhumResultadoInline(termo);
        return;
    }
    
    // Exibir resultados diretamente na página
    mostrarResultadosNaPagina(produtosEncontrados, termo);
    ocultarSugestoesInline();
}

// Função para mostrar estado vazio inline
function mostrarEstadoVazioInline() {
    // Voltar ao estado normal da página
    if (window.location.hash.includes('#search')) {
        window.location.hash = '';
    }
    
    // Recarregar a categoria ativa
    if (categoriaAtiva && categoriaAtiva.idcategoria !== 'search') {
        carregarProdutosCategoria(categoriaAtiva.idcategoria);
    }
}

// Função para mostrar estado nenhum resultado inline
function mostrarEstadoNenhumResultadoInline(termo) {
    mostrarResultadosNaPagina([], termo);
}

// Função para mostrar resultados na página principal
function mostrarResultadosNaPagina(produtos, termo) {
    // Atualizar categoria ativa
    categoriaAtiva = { nome: `Resultados para "${termo}"`, idcategoria: 'search' };
    
    // Atualizar título da seção
    const produtosSection = document.querySelector('.produtos-section h2');
    if (produtosSection) {
        produtosSection.textContent = `Resultados para "${termo}"`;
    }
    
    // Limpar produtos atuais
    const produtosContainer = document.getElementById('produtos');
    if (!produtosContainer) return;
    
    if (produtos.length === 0) {
        produtosContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #6c757d;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h2>Nenhum produto encontrado</h2>
                <p>Tente buscar com outros termos ou verifique a ortografia.</p>
                <small style="color: #adb5bd; margin-top: 10px; display: block;">
                    Buscando por: "${termo}"
                </small>
            </div>
        `;
        return;
    }
    
    // Renderizar produtos encontrados
    produtosContainer.innerHTML = produtos.map(produto => {
        const preco = produto.preco.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
        
        return `
            <div class="produto-card" onclick="abrirModalProduto(${produto.idproduto})">
                <div class="produto-image">
                    <img src="${produto.imagem || '/imgs/placeholder.jpg'}" alt="${produto.nome}" loading="lazy">
                    <div class="produto-overlay">
                        <button class="btn-overlay" onclick="event.stopPropagation(); abrirModalProduto(${produto.idproduto})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="produto-info">
                    <h3 class="produto-nome">${produto.nome}</h3>
                    <p class="produto-descricao">${produto.descricao || 'Sem descrição disponível.'}</p>
                    <div class="produto-preco">R$ ${preco}</div>
                    <button class="btn-adicionar" onclick="event.stopPropagation(); adicionarAoCarrinho(${produto.idproduto})">
                        <i class="fas fa-plus"></i>
                        Adicionar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Função para fechar modal de busca
function fecharModalBusca() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Função para executar busca
function executarBusca() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    const termo = searchInput.value.trim();
    
    if (!termo) {
        searchResults.innerHTML = '<p style="text-align: center; color: #6c757d;">Digite um termo para buscar produtos.</p>';
        return;
    }
    
    // Buscar produtos
    const produtosEncontrados = buscarProdutosInterno(termo);
    
    if (produtosEncontrados.length === 0) {
        searchResults.innerHTML = `
            <div style="text-align: center; color: #6c757d; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum produto encontrado para "${termo}".</p>
                <p>Tente usar termos diferentes.</p>
            </div>
        `;
        return;
    }
    
    // Renderizar resultados
    searchResults.innerHTML = produtosEncontrados.map(produto => {
        const preco = formatarPreco(produto.preco);
        const imagem = produto.imagem ? 
            (produto.imagem.startsWith('/imgs/') ? produto.imagem : `/imgs/${produto.imagem}`) : 
            null;
        
        return `
            <div class="search-result-item" onclick="selecionarProdutoDaBusca(${produto.idproduto})">
                <div class="search-result-image">
                    ${imagem ? 
                        `<img src="${imagem}" alt="${produto.nome}">` :
                        `<i class="fas fa-utensils" style="color: #adb5bd;"></i>`
                    }
                </div>
                <div class="search-result-info">
                    <div class="search-result-name">${produto.nome}</div>
                    <div class="search-result-price">R$ ${preco}</div>
                    <div class="search-result-description">${produto.descricao || 'Sem descrição disponível.'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Função interna para buscar produtos
function buscarProdutosInterno(termo) {
    if (!cardapioData || !termo) {
        return [];
    }
    
    const termoLower = termo.toLowerCase();
    const produtosEncontrados = [];
    
    cardapioData.categorias.forEach(categoria => {
        if (categoria.produtos) {
            categoria.produtos.forEach(produto => {
                if (produto.nome.toLowerCase().includes(termoLower) ||
                    produto.descricao.toLowerCase().includes(termoLower)) {
                    produtosEncontrados.push(produto);
                }
            });
        }
    });
    
    return produtosEncontrados;
}

// Função para selecionar produto da busca
function selecionarProdutoDaBusca(produtoId) {
    const produto = produtosExibidos.find(p => p.idproduto === produtoId) || 
                   cardapioData.categorias.flatMap(c => c.produtos || []).find(p => p.idproduto === produtoId);
    
    if (produto) {
        fecharModalBusca();
        abrirModalProduto(produto);
    }
}

// Configurar event listeners adicionais
function configurarEventListenersAdicionais() {
    // Modal de busca
    const searchModal = document.getElementById('searchModal');
    const closeSearchModal = document.getElementById('closeSearchModal');
    
    if (closeSearchModal) {
        closeSearchModal.addEventListener('click', fecharModalBusca);
    }
    
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                fecharModalBusca();
            }
        });
    }
    
    // Busca inline com Enter e sugestões
    const searchInputInline = document.getElementById('searchInputInline');
    if (searchInputInline) {
        searchInputInline.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executarBuscaInline();
                ocultarSugestoesInline();
            }
        });
        
        // Mostrar sugestões quando o campo estiver vazio
        searchInputInline.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                mostrarSugestoesInline();
            } else {
                ocultarSugestoesInline();
            }
        });
        
        // Mostrar sugestões ao focar no campo
        searchInputInline.addEventListener('focus', () => {
            if (searchInputInline.value.trim() === '') {
                mostrarSugestoesInline();
            }
        });
        
        // Fechar sugestões ao clicar fora
        searchInputInline.addEventListener('blur', () => {
            setTimeout(ocultarSugestoesInline, 200);
        });
        
        // Carregar sugestões iniciais
        carregarSugestoesInline();
    }
}

// Função para navegar para uma categoria específica via URL
async function navegarParaCategoria(categoriaId) {
    if (!cardapioData) return;
    
    const categoria = cardapioData.categorias.find(c => c.idcategoria == categoriaId);
    if (categoria) {
        await selecionarCategoria(categoria);
    }
}

// Função para navegar para um produto específico via URL
async function navegarParaProduto(produtoId) {
    if (!cardapioData) return;
    
    // Encontrar o produto em qualquer categoria
    for (const categoria of cardapioData.categorias) {
        if (categoria.produtos) {
            const produto = categoria.produtos.find(p => p.idproduto == produtoId);
            if (produto) {
                await selecionarCategoria(categoria);
                setTimeout(() => {
                    abrirModalProduto(produto);
                }, 500);
                return;
            }
        }
    }
}

// Função para compartilhar produto
function compartilharProduto(produtoId) {
    const produto = produtosExibidos.find(p => p.idproduto === produtoId) || 
                   cardapioData.categorias.flatMap(c => c.produtos || []).find(p => p.idproduto === produtoId);
    
    if (produto && navigator.share) {
        navigator.share({
            title: produto.nome,
            text: produto.descricao,
            url: `${window.location.origin}/cardapio-publico?produto=${produtoId}`
        });
    } else {
        // Fallback: copiar URL para clipboard
        const url = `${window.location.origin}/cardapio-publico?produto=${produtoId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link do produto copiado para a área de transferência!');
        });
    }
}

// Verificar parâmetros da URL ao carregar
function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaId = urlParams.get('categoria');
    const produtoId = urlParams.get('produto');
    
    if (categoriaId) {
        setTimeout(() => navegarParaCategoria(categoriaId), 1000);
    } else if (produtoId) {
        setTimeout(() => navegarParaProduto(produtoId), 1000);
    }
}

// Atualizar configuração de event listeners
function configurarEventListeners() {
    configurarEventListenersAdicionais();
    
    // Fechar modal
    if (closeModal) {
        closeModal.addEventListener('click', fecharModal);
    }
    
    // Fechar modal clicando fora
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModal();
            }
        });
    }
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.style.display === 'block') {
                fecharModal();
            }
            if (searchModal && searchModal.style.display === 'block') {
                fecharModalBusca();
            }
        }
    });
    
    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = href && href !== '#' && href.length > 1 ? document.querySelector(href) : null;
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Atualizar inicialização para incluir verificação de URL
async function inicializarCardapio() {
    try {
        mostrarLoading();
        await carregarCardapio();
        await renderizarCategorias();
        
        // Verificar parâmetros da URL
        verificarParametrosURL();
    } catch (error) {
        console.error('Erro ao inicializar cardápio:', error);
        mostrarErro('Erro ao carregar o cardápio. Tente novamente.');
    }
}

// Função para carregar sugestões inline
function carregarSugestoesInline() {
    const searchSuggestions = document.getElementById('searchSuggestionsInline');
    if (!searchSuggestions) return;
    
    // Sugestões baseadas nos produtos mais populares
    const sugestoes = [
        { texto: 'X-Burger', icon: 'fas fa-hamburger' },
        { texto: 'Batata Frita', icon: 'fas fa-french-fries' },
        { texto: 'Coca-Cola', icon: 'fas fa-wine-bottle' },
        { texto: 'X-Bacon', icon: 'fas fa-bacon' },
        { texto: 'Milkshake', icon: 'fas fa-ice-cream' }
    ];
    
    searchSuggestions.innerHTML = sugestoes.map(sugestao => `
        <div class="search-suggestion-item-inline" onclick="usarSugestaoInline('${sugestao.texto}')">
            <i class="${sugestao.icon}"></i>
            <span>${sugestao.texto}</span>
        </div>
    `).join('');
    
    searchSuggestions.style.display = 'block';
}

// Função para usar sugestão inline
function usarSugestaoInline(texto) {
    const searchInput = document.getElementById('searchInputInline');
    if (searchInput) {
        searchInput.value = texto;
        executarBuscaInline();
        ocultarSugestoesInline();
    }
}

// Função para ocultar sugestões inline
function ocultarSugestoesInline() {
    const searchSuggestions = document.getElementById('searchSuggestionsInline');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }
}

// Função para mostrar sugestões inline
function mostrarSugestoesInline() {
    const searchSuggestions = document.getElementById('searchSuggestionsInline');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'block';
    }
}

// Função para usar sugestão (mantida para compatibilidade)
function usarSugestao(texto) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = texto;
        executarBusca();
        ocultarSugestoes();
    }
}

// Função para ocultar sugestões
function ocultarSugestoes() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }
}

// Função para mostrar sugestões
function mostrarSugestoes() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'block';
    }
}

// Função para alternar filtros
function alternarFiltro(elemento) {
    // Remover classe active de todos os filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao filtro clicado
    elemento.classList.add('active');
    
    // Executar busca novamente se houver termo
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        executarBusca();
    }
}

// Função para mostrar estado vazio
function mostrarEstadoVazio() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-search"></i>
                <h3>Busque por seus produtos favoritos</h3>
                <p>Digite o nome do produto ou use os filtros acima</p>
            </div>
        `;
    }
}

// Função para mostrar estado nenhum resultado
function mostrarEstadoNenhumResultado(termo) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente buscar com outros termos ou verifique a ortografia.</p>
                <small style="color: #adb5bd; margin-top: 10px; display: block;">
                    Buscando por: "${termo}"
                </small>
            </div>
        `;
    }
}

// Função para mostrar resultados da busca
function mostrarResultadosBusca(produtos) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = produtos.map(produto => {
            const preco = produto.preco.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
            
            return `
                <div class="search-result-item" onclick="selecionarProdutoDaBusca(${produto.idproduto})">
                    <div class="search-result-image">
                        <img src="${produto.imagem || '/imgs/placeholder.jpg'}" alt="${produto.nome}" loading="lazy">
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-name">${produto.nome}</div>
                        <div class="search-result-price">R$ ${preco}</div>
                        <div class="search-result-description">${produto.descricao || 'Sem descrição disponível.'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Exportar funções para uso global
window.buscarProdutos = buscarProdutos;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.adicionarAosFavoritos = adicionarAosFavoritos;
window.fecharModal = fecharModal;
window.executarBuscaInline = executarBuscaInline;
window.usarSugestaoInline = usarSugestaoInline;
window.compartilharProduto = compartilharProduto;

// Exportar funções do carrinho
window.adicionarAoCarrinhoComOpcionais = adicionarAoCarrinhoComOpcionais;
window.alterarQuantidadeCarrinho = alterarQuantidadeCarrinho;
window.removerItemCarrinho = removerItemCarrinho;
window.limparCarrinho = limparCarrinho;
window.finalizarCompra = finalizarCompra;
window.atualizarCarrinho = atualizarCarrinho;
