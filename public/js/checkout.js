// CHECKOUT PAGE - JavaScript

// Variáveis globais
let enderecoSelecionado = null;
let formaPagamentoSelecionada = null;
let carrinhoData = [];
let carrinhoRawData = [];
let taxaEntrega = 5.00; // Taxa fixa de entrega

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados (sem verificação de autenticação)
    carregarCarrinhoLocalStorage();
    carregarDadosCliente();
    carregarEnderecos();
    carregarFormasPagamento();
    
    // Configurar event listeners
    configurarEventListeners();
});

// Verificar se usuário está autenticado
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Verificar se há usuário logado
function isUsuarioLogado() {
    return verificarAutenticacao();
}

// Carregar carrinho do localStorage
function carregarCarrinhoLocalStorage() {
    // Tentar ambas as chaves para compatibilidade
    let carrinhoStr = localStorage.getItem('julaosBurger_carrinho');
    
    // Se não encontrar, tentar a chave antiga
    if (!carrinhoStr) {
        carrinhoStr = localStorage.getItem('cart');
    }
    
    console.log('Chave do carrinho encontrada:', carrinhoStr ? 'Sim' : 'Não');
    
    if (carrinhoStr) {
        try {
            carrinhoRawData = JSON.parse(carrinhoStr) || [];
        } catch (error) {
            console.error('Erro ao interpretar carrinho:', error);
            carrinhoRawData = [];
        }

        if (!Array.isArray(carrinhoRawData)) {
            carrinhoRawData = [];
        }

        // Garantir que todos os itens possuam o campo de observação
        carrinhoRawData = carrinhoRawData.map(item => {
            if (item && typeof item === 'object') {
                if (typeof item.observacao === 'undefined') {
                    item.observacao = '';
                }
            }
            return item;
        });

        // Converter para a estrutura usada no checkout
        carrinhoData = carrinhoRawData.map(normalizarItemCarrinho);
        
        console.log('Dados do carrinho carregados:', carrinhoData);
        renderizarResumoPedido();
    } else {
        alert('Seu carrinho está vazio!');
        window.location.href = '/';
    }
}

function normalizarItemCarrinho(item) {
    if (!item || typeof item !== 'object') {
        return {
            idproduto: null,
            precoFinal: 0,
            quantidade: 0,
            nome: '',
            imagem: null,
            opcionais: [],
            observacao: ''
        };
    }

    const preco = parseFloat(
        item.precoFinal ?? item.preco ?? item.precoBase ?? 0
    );

    return {
        idproduto: item.idproduto || item.produtoId || item.id,
        precoFinal: Number.isNaN(preco) ? 0 : preco,
        quantidade: item.quantidade || 1,
        nome: item.nome || 'Produto',
        imagem: item.imagem || null,
        opcionais: item.opcionais || [],
        observacao: item.observacao || ''
    };
}

function salvarCarrinhoRawAtualizado() {
    try {
        const serializado = JSON.stringify(carrinhoRawData || []);
        localStorage.setItem('julaosBurger_carrinho', serializado);
        localStorage.setItem('cart', serializado);
    } catch (error) {
        console.error('Erro ao salvar carrinho com observações:', error);
    }
}

// Carregar dados do cliente
async function carregarDadosCliente() {
    // Primeiro, verificar se há dados temporários no localStorage
    const dadosTemporarios = localStorage.getItem('dados_cliente_temp');
    
    if (dadosTemporarios) {
        try {
            const dados = JSON.parse(dadosTemporarios);
            // Verificar se os dados não expiraram (24h)
            const timestamp = dados.timestamp || 0;
            const agora = Date.now();
            const horas24 = 24 * 60 * 60 * 1000;
            
            if ((agora - timestamp) < horas24) {
                // Dados ainda válidos, renderizar formulário com dados preenchidos
                renderizarFormularioDadosCliente(dados);
                return;
            } else {
                // Dados expirados, remover
                localStorage.removeItem('dados_cliente_temp');
            }
        } catch (error) {
            console.error('Erro ao carregar dados temporários:', error);
        }
    }
    
    // Se usuário está logado, carregar do backend
    if (isUsuarioLogado()) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/usuarios/perfil', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token inválido, carregar formulário vazio
                renderizarFormularioDadosCliente();
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao carregar dados do usuário');
            }

            const dadosUsuario = await response.json();
            renderizarDadosCliente(dadosUsuario);
            
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            renderizarFormularioDadosCliente();
        }
    } else {
        // Usuário não logado, mostrar formulário vazio
        renderizarFormularioDadosCliente();
    }
}

// Renderizar dados do cliente (usuário logado)
function renderizarDadosCliente(dadosUsuario) {
    const container = document.getElementById('dadosClienteContainer');
    
    const html = `
        <div class="dados-cliente-exibicao">
            <div class="dado-item">
                <i class="fas fa-user"></i>
                <div class="dado-info">
                    <span class="dado-label">Nome</span>
                    <span class="dado-value">${dadosUsuario.nome || 'Não informado'}</span>
                </div>
            </div>
            <div class="dado-item">
                <i class="fas fa-phone"></i>
                <div class="dado-info">
                    <span class="dado-label">Telefone</span>
                    <span class="dado-value">${dadosUsuario.telefone || 'Não informado'}</span>
                </div>
            </div>
            <div class="dado-item">
                <i class="fas fa-envelope"></i>
                <div class="dado-info">
                    <span class="dado-label">E-mail</span>
                    <span class="dado-value">${dadosUsuario.email || 'Não informado'}</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Renderizar formulário de dados do cliente (usuário não logado)
function renderizarFormularioDadosCliente(dadosPreenchidos = null) {
    const container = document.getElementById('dadosClienteContainer');
    
    const html = `
        <div class="form-dados-cliente">
            <div class="form-group">
                <label for="nomeCliente">Nome Completo *</label>
                <input type="text" id="nomeCliente" class="form-control" placeholder="Seu nome completo" 
                       value="${dadosPreenchidos?.nome || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="telefoneCliente">Telefone *</label>
                <input type="tel" id="telefoneCliente" class="form-control" placeholder="(00) 00000-0000" 
                       value="${dadosPreenchidos?.telefone || ''}" maxlength="15" required>
            </div>
            
            <div class="form-group">
                <label for="emailCliente">E-mail</label>
                <input type="email" id="emailCliente" class="form-control" placeholder="seu@email.com"
                       value="${dadosPreenchidos?.email || ''}">
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Adicionar máscara de telefone
    const telefoneInput = document.getElementById('telefoneCliente');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 10) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else {
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
            }
            e.target.value = value;
        });
    }
    
    // Adicionar event listeners para salvar automaticamente no localStorage
    const nomeInput = document.getElementById('nomeCliente');
    const emailInput = document.getElementById('emailCliente');
    
    // Salvar automaticamente após digitar (com debounce)
    let saveTimeout;
    const salvarDadosTemporarios = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const dados = {
                nome: nomeInput.value.trim(),
                telefone: telefoneInput.value.trim(),
                email: emailInput.value.trim(),
                timestamp: Date.now()
            };
            
            // Salvar no localStorage
            localStorage.setItem('dados_cliente_temp', JSON.stringify(dados));
        }, 500); // Aguarda 500ms após parar de digitar
    };
    
    nomeInput.addEventListener('input', salvarDadosTemporarios);
    telefoneInput.addEventListener('input', salvarDadosTemporarios);
    emailInput.addEventListener('input', salvarDadosTemporarios);
}

// Carregar endereços do usuário
async function carregarEnderecos() {
    // Se usuário está logado, carregar do backend
    if (isUsuarioLogado()) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/enderecos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token inválido, carregar endereços temporários
                carregarEnderecosTemporarios();
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao carregar endereços');
            }

            const enderecos = await response.json();
            renderizarEnderecos(enderecos);
            
        } catch (error) {
            console.error('Erro ao carregar endereços:', error);
            carregarEnderecosTemporarios();
        }
    } else {
        // Usuário não logado, carregar endereços temporários
        carregarEnderecosTemporarios();
    }
}

// Carregar endereços temporários do localStorage
function carregarEnderecosTemporarios() {
    const enderecosTemp = localStorage.getItem('enderecos_temporarios');
    
    if (enderecosTemp) {
        try {
            const enderecos = JSON.parse(enderecosTemp);
            // Verificar se os endereços não expiraram (24h)
            const enderecosValidos = enderecos.filter(endereco => {
                const timestamp = endereco.timestamp || 0;
                const agora = Date.now();
                const horas24 = 24 * 60 * 60 * 1000;
                return (agora - timestamp) < horas24;
            });
            
            // Atualizar localStorage se houver endereços expirados
            if (enderecosValidos.length !== enderecos.length) {
                localStorage.setItem('enderecos_temporarios', JSON.stringify(enderecosValidos));
            }
            
            renderizarEnderecos(enderecosValidos);
        } catch (error) {
            console.error('Erro ao carregar endereços temporários:', error);
            renderizarEnderecos([]);
        }
    } else {
        renderizarEnderecos([]);
    }
}

// Renderizar endereços
function renderizarEnderecos(enderecos) {
    const container = document.getElementById('enderecoContainer');
    
    if (enderecos.length === 0) {
        container.innerHTML = `
            <div class="empty-enderecos">
                <i class="fas fa-map-marker-alt"></i>
                <p>Nenhum endereço cadastrado</p>
                <small>Adicione um endereço para continuar</small>
            </div>
        `;
        return;
    }

    let html = '';
    enderecos.forEach(endereco => {
        const isPrincipal = endereco.principal === 1 || endereco.principal === true;
        if (isPrincipal && !enderecoSelecionado) {
            enderecoSelecionado = endereco;
        }

        html += `
            <div class="endereco-option ${isPrincipal ? 'selected' : ''}" data-id="${endereco.idendereco}">
                <label class="endereco-label">
                    <input type="radio" name="endereco" value="${endereco.idendereco}" 
                           ${isPrincipal ? 'checked' : ''}
                           onchange="selecionarEndereco(${endereco.idendereco}, ${JSON.stringify(endereco).replace(/"/g, '&quot;')})">
                    <div class="endereco-info">
                        <span class="endereco-nome">
                            ${endereco.nome || 'Endereço'}
                            ${isPrincipal ? '<span class="endereco-principal">Principal</span>' : ''}
                        </span>
                        <div class="endereco-detalhes">
                            ${endereco.logradouro}, ${endereco.numero}
                            ${endereco.complemento ? '- ' + endereco.complemento : ''}<br>
                            ${endereco.bairro} - ${endereco.cidade}/${endereco.estado}<br>
                            CEP: ${endereco.cep}
                        </div>
                    </div>
                </label>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Habilitar botão de confirmar se houver endereço selecionado
    if (enderecoSelecionado) {
        document.getElementById('btnConfirmarPedido').disabled = false;
    }
}

// Selecionar endereço
function selecionarEndereco(id, endereco) {
    enderecoSelecionado = endereco;
    
    // Atualizar UI
    document.querySelectorAll('.endereco-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-id="${id}"]`).classList.add('selected');
    
    // Habilitar botão
    document.getElementById('btnConfirmarPedido').disabled = false;
}

// Renderizar resumo do pedido
function renderizarResumoPedido() {
    const container = document.getElementById('resumoItens');
    
    if (carrinhoData.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Carrinho vazio</p>
            </div>
        `;
        return;
    }

    let html = '';
    let subtotal = 0;

    carrinhoData.forEach((item, index) => {
        const itemTotal = item.precoFinal * item.quantidade;
        subtotal += itemTotal;

        const observacaoSanitizada = escaparHTML(item.observacao || '');

        html += `
            <div class="summary-item" data-index="${index}">
                <img src="${item.imagem || '/imgs/default-product.png'}" alt="${item.nome}" class="summary-item-img" 
                     onerror="this.src='/imgs/default-product.png'">
                <div class="summary-item-info">
                    <div class="summary-item-nome">${item.nome}</div>
                    ${item.opcionais && item.opcionais.length > 0 ? `
                        <div class="summary-item-detalhes">
                            ${item.opcionais.map(op => op.nome).join(', ')}
                        </div>
                    ` : ''}
                    <div class="summary-item-qtd">${item.quantidade}x</div>
                    <div class="summary-item-observacao">
                        <label for="observacao-item-${index}">Observações do item</label>
                        <textarea 
                            id="observacao-item-${index}" 
                            class="summary-item-observacao-textarea" 
                            data-index="${index}" 
                            rows="2"
                            placeholder="Ex: tirar cebola, cortar ao meio">${observacaoSanitizada}</textarea>
                    </div>
                </div>
                <div class="summary-item-preco">R$ ${formatarPreco(itemTotal)}</div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Registrar listeners para observações
    const camposObservacao = container.querySelectorAll('.summary-item-observacao-textarea');
    camposObservacao.forEach(textarea => {
        textarea.addEventListener('input', (evento) => {
            const index = Number(evento.target.dataset.index);
            if (Number.isNaN(index) || !carrinhoData[index]) {
                return;
            }

            const valor = evento.target.value;
            carrinhoData[index].observacao = valor;

            if (carrinhoRawData[index] && typeof carrinhoRawData[index] === 'object') {
                carrinhoRawData[index].observacao = valor;
            }

            salvarCarrinhoRawAtualizado();
        });
    });
    
    // Atualizar totais
    const totalTaxaEntrega = calcularTaxaEntrega(subtotal);
    const totalFinal = subtotal + totalTaxaEntrega;
    
    document.getElementById('subtotal').textContent = `R$ ${formatarPreco(subtotal)}`;
    document.getElementById('taxaEntrega').textContent = `R$ ${formatarPreco(totalTaxaEntrega)}`;
    document.getElementById('totalPedido').textContent = `R$ ${formatarPreco(totalFinal)}`;
}

// Calcular taxa de entrega
function calcularTaxaEntrega(subtotal) {
    // Entrega grátis para pedidos acima de R$ 200
    if (subtotal >= 200) {
        return 0;
    }
    return taxaEntrega;
}

// Carregar formas de pagamento
async function carregarFormasPagamento() {
    try {
        const response = await fetch('/api/formas-pagamento');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar formas de pagamento');
        }

        const formas = await response.json();
        renderizarFormasPagamento(formas);
        
    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        document.getElementById('formaPagamentoContainer').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao carregar formas de pagamento.</p>
            </div>
        `;
    }
}

// Renderizar formas de pagamento
function renderizarFormasPagamento(formas) {
    const container = document.getElementById('formaPagamentoContainer');
    
    if (formas.length === 0) {
        container.innerHTML = `
            <div class="empty-formas">
                <i class="fas fa-credit-card"></i>
                <p>Nenhuma forma de pagamento disponível</p>
            </div>
        `;
        return;
    }

    let html = '';
    formas.forEach((forma, index) => {
        const isFirst = index === 0;
        if (isFirst && !formaPagamentoSelecionada) {
            formaPagamentoSelecionada = forma;
        }

        html += `
            <div class="forma-pagamento-option ${isFirst ? 'selected' : ''}" data-id="${forma.idforma_pagamento}">
                <label class="forma-pagamento-label">
                    <input type="radio" name="formaPagamento" value="${forma.idforma_pagamento}" 
                           ${isFirst ? 'checked' : ''}
                           onchange="selecionarFormaPagamento(${forma.idforma_pagamento}, ${JSON.stringify(forma).replace(/"/g, '&quot;')})">
                    <div class="forma-pagamento-nome">${forma.nome}</div>
                </label>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Selecionar forma de pagamento
function selecionarFormaPagamento(id, forma) {
    formaPagamentoSelecionada = forma;
    
    // Atualizar UI
    document.querySelectorAll('.forma-pagamento-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-id="${id}"]`).classList.add('selected');
}

// Configurar event listeners
function configurarEventListeners() {
    // Botão adicionar novo endereço
    document.getElementById('btnNovoEndereco').addEventListener('click', function() {
        abrirModalEndereco();
    });

    // Formulário de novo endereço
    document.getElementById('formNovoEndereco').addEventListener('submit', salvarNovoEndereco);

    // Botão confirmar pedido
    document.getElementById('btnConfirmarPedido').addEventListener('click', confirmarPedido);

    // Máscara CEP
    const cepInput = document.getElementById('cepEndereco');
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;

        // Buscar CEP automaticamente quando completo
        if (value.length === 9) {
            buscarCEP(value);
        }
    });
}

// Abrir modal de endereço
function abrirModalEndereco() {
    document.getElementById('modalNovoEndereco').classList.add('active');
    
    // Fechar modal ao clicar fora
    document.getElementById('modalNovoEndereco').addEventListener('click', function(e) {
        if (e.target.id === 'modalNovoEndereco') {
            fecharModalEndereco();
        }
    });
}

// Fechar modal de endereço
function fecharModalEndereco() {
    document.getElementById('modalNovoEndereco').classList.remove('active');
    document.getElementById('formNovoEndereco').reset();
}

// Buscar CEP via API
async function buscarCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (!data.erro) {
            document.getElementById('logradouroEndereco').value = data.logradouro || '';
            document.getElementById('bairroEndereco').value = data.bairro || '';
            document.getElementById('cidadeEndereco').value = data.localidade || '';
            document.getElementById('estadoEndereco').value = data.uf || '';
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// Salvar novo endereço
async function salvarNovoEndereco(event) {
    event.preventDefault();

    const endereco = {
        nome: document.getElementById('nomeEndereco').value,
        cep: document.getElementById('cepEndereco').value,
        logradouro: document.getElementById('logradouroEndereco').value,
        numero: document.getElementById('numeroEndereco').value,
        complemento: document.getElementById('complementoEndereco').value || '',
        bairro: document.getElementById('bairroEndereco').value,
        cidade: document.getElementById('cidadeEndereco').value,
        estado: document.getElementById('estadoEndereco').value,
        principal: false
    };

    // Se usuário está logado, salvar no backend
    if (isUsuarioLogado()) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/enderecos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(endereco)
            });

            if (response.status === 401) {
                // Token inválido, salvar temporariamente
                salvarEnderecoTemporario(endereco);
            } else if (response.ok) {
                const novoEndereco = await response.json();
                fecharModalEndereco();
                carregarEnderecos();
            } else {
                alert('Erro ao salvar endereço');
            }
        } catch (error) {
            console.error('Erro ao salvar endereço:', error);
            // Em caso de erro, tentar salvar temporariamente
            salvarEnderecoTemporario(endereco);
        }
    } else {
        // Usuário não logado, salvar temporariamente
        salvarEnderecoTemporario(endereco);
    }
}

// Salvar endereço temporário no localStorage
function salvarEnderecoTemporario(endereco) {
    // Adicionar timestamp
    endereco.timestamp = Date.now();
    endereco.idendereco = 'temp_' + Date.now(); // ID temporário

    const enderecosTemp = localStorage.getItem('enderecos_temporarios');
    let enderecos = [];

    if (enderecosTemp) {
        enderecos = JSON.parse(enderecosTemp);
    }

    enderecos.push(endereco);
    localStorage.setItem('enderecos_temporarios', JSON.stringify(enderecos));

    fecharModalEndereco();
    carregarEnderecos();
}

// Confirmar pedido
async function confirmarPedido() {
    try {
        // Validar dados do cliente (se não estiver logado)
        if (!isUsuarioLogado()) {
            const nomeCliente = document.getElementById('nomeCliente')?.value?.trim();
            const telefoneCliente = document.getElementById('telefoneCliente')?.value?.trim();
            
            if (!nomeCliente) {
                alert('Por favor, preencha seu nome completo');
                return;
            }
            
            if (!telefoneCliente) {
                alert('Por favor, preencha seu telefone');
                return;
            }
        }
        
        // Validar dados
        if (!enderecoSelecionado) {
            alert('Selecione um endereço de entrega');
            return;
        }

        if (!formaPagamentoSelecionada) {
            alert('Selecione uma forma de pagamento');
            return;
        }

        if (carrinhoData.length === 0) {
            alert('Seu carrinho está vazio');
            return;
        }

        // Calcular totais
        const subtotal = carrinhoData.reduce((total, item) => total + (item.precoFinal * item.quantidade), 0);
        const totalTaxaEntrega = calcularTaxaEntrega(subtotal);
        const totalFinal = subtotal + totalTaxaEntrega;

        // Coletar observações
        const observacoes = document.getElementById('observacoesPedido').value;
        
        // Coletar dados do cliente (se não estiver logado)
        let dadosCliente = {};
        if (!isUsuarioLogado()) {
            dadosCliente = {
                nome: document.getElementById('nomeCliente').value,
                telefone: document.getElementById('telefoneCliente').value,
                email: document.getElementById('emailCliente').value || null
            };
        }

        // Preparar dados do pedido
        const pedidoData = {
            idendereco: enderecoSelecionado.idendereco,
            idforma_pagamento: formaPagamentoSelecionada.idforma_pagamento,
            itens: carrinhoData.map(item => {
                const observacaoItem = item.observacao ? item.observacao.trim() : '';
                return {
                    idproduto: item.idproduto,
                    quantidade: item.quantidade,
                    preco_unitario: item.precoFinal,
                    observacao: observacaoItem.length > 0 ? observacaoItem : null,
                    opcionais: item.opcionais || []
                };
            }),
            valor_total: totalFinal,
            valor_entrega: totalTaxaEntrega,
            observacoes: observacoes,
            enderecoCompleto: enderecoSelecionado, // Para endereços temporários
            dadosCliente: Object.keys(dadosCliente).length > 0 ? dadosCliente : null // Dados do cliente não logado
        };

        // Se usuário está logado, enviar pedido para o backend
        if (isUsuarioLogado()) {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pedidoData)
            });

            if (response.status === 401) {
                // Token inválido, salvar pedido localmente
                alert('Sua sessão expirou. O pedido será salvo localmente.');
                salvarPedidoLocal(pedidoData);
                return;
            }

            const resultado = await response.json();

            if (response.ok) {
                // Limpar carrinho
                localStorage.removeItem('julaosBurger_carrinho');
                localStorage.removeItem('cart');
                
                // Redirecionar para a tela de acompanhamento do pedido
                const pedidoId = resultado?.pedidoId;
                const rotaAcompanhamento = pedidoId
                    ? `/pedidos_cliente?pedido=${pedidoId}`
                    : '/pedidos_cliente';

                window.location.href = rotaAcompanhamento;
            } else {
                alert('Erro ao confirmar pedido: ' + (resultado.erro || 'Erro desconhecido'));
            }
        } else {
            // Usuário não logado, salvar pedido localmente
            salvarPedidoLocal(pedidoData);
        }

    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        alert('Erro ao confirmar pedido. Tente novamente.');
    }
}

// Salvar pedido localmente (para usuários não logados)
function salvarPedidoLocal(pedidoData) {
    // Adicionar timestamp
    pedidoData.timestamp = Date.now();
    
    const pedidosLocal = localStorage.getItem('pedidos_locais');
    let pedidos = [];

    if (pedidosLocal) {
        pedidos = JSON.parse(pedidosLocal);
    }

    pedidos.push(pedidoData);
    localStorage.setItem('pedidos_locais', JSON.stringify(pedidos));

    // Limpar carrinho
    localStorage.removeItem('julaosBurger_carrinho');
    localStorage.removeItem('cart');
    
    // Redirecionar para página de confirmação
    alert('Pedido salvo! Faça login para acompanhar seu pedido.');
    window.location.href = '/login_cadastro.html';
}

// Função auxiliar para formatar preço
function formatarPreco(valor) {
    return valor.toFixed(2).replace('.', ',');
}

function escaparHTML(texto) {
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
