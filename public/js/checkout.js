// CHECKOUT PAGE - JavaScript

// Variáveis globais
let enderecoSelecionado = null;
let formaPagamentoSelecionada = null;
let carrinhoData = [];
let carrinhoRawData = [];
let taxasEntrega = [];
let taxaEntregaSelecionada = null;
let distanciaCalculada = null;
let tipoPedido = 'entrega'; // 'entrega' ou 'retirada'
let pontosDisponiveis = 0;
let pagamentoPorProduto = {}; // { index: 'pontos' | 'dinheiro' }

// Endereço do restaurante (configurável - pode vir de uma API ou configuração)
const ENDERECO_RESTAURANTE = {
    logradouro: 'Rua dos Bandeirantes',
    numero: '813',
    bairro: 'Vila Bocaina',
    cidade: 'Mauá',
    estado: 'SP',
    cep: '09350276'
};

// WhatsApp da hamburgueria (formato: 5511999999999 - sem caracteres especiais)
const WHATSAPP_RESTAURANTE = '5511993199463'; // Substitua pelo número real do restaurante

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados (sem verificação de autenticação)
    carregarCarrinhoLocalStorage();
    carregarDadosCliente();
    carregarEnderecos();
    carregarFormasPagamento();
    carregarTaxasEntrega();
    
    // Carregar pontos se estiver logado
    if (isUsuarioLogado()) {
        carregarPontosUsuario();
    }
    
    // Configurar event listeners
    configurarEventListeners();
});

// Verificar se há usuário logado
function isUsuarioLogado() {
    return !!localStorage.getItem('token');
}

// Carregar carrinho do localStorage
function carregarCarrinhoLocalStorage() {
    // Tentar ambas as chaves para compatibilidade
    let carrinhoStr = localStorage.getItem('julaosBurger_carrinho');
    
    // Se não encontrar, tentar a chave antiga
    if (!carrinhoStr) {
        carrinhoStr = localStorage.getItem('cart');
    }
    
    if (carrinhoStr) {
        try {
            carrinhoRawData = JSON.parse(carrinhoStr) || [];
        } catch (error) {
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
        renderizarResumoPedido();
    } else {
        showWarning('Seu carrinho está vazio!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
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
            observacao: '',
            preco_pontos: 0
        };
    }

    const preco = parseFloat(
        item.precoFinal ?? item.preco ?? item.precoBase ?? 0
    );
    
    const precoPontos = parseFloat(
        item.preco_pontos ?? item.precoPontos ?? 0
    );

    return {
        idproduto: item.idproduto || item.produtoId || item.id,
        precoFinal: Number.isNaN(preco) ? 0 : preco,
        quantidade: item.quantidade || 1,
        nome: item.nome || 'Produto',
        imagem: item.imagem || null,
        opcionais: item.opcionais || [],
        observacao: item.observacao || '',
        preco_pontos: Number.isNaN(precoPontos) ? 0 : precoPontos
    };
}

function salvarCarrinhoRawAtualizado() {
    try {
        const serializado = JSON.stringify(carrinhoRawData || []);
        localStorage.setItem('julaosBurger_carrinho', serializado);
        localStorage.setItem('cart', serializado);
    } catch (error) {
        // Erro silencioso ao salvar carrinho
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
            // Erro silencioso ao carregar dados temporários
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
                <label for="emailCliente">E-mail *</label>
                <input type="email" id="emailCliente" class="form-control" placeholder="seu@email.com"
                       value="${dadosPreenchidos?.email || ''}" required>
                <small class="form-text">Necessário para fazer login e acompanhar seu pedido</small>
            </div>
            
            <div class="form-group">
                <label for="senhaCliente">Senha *</label>
                <input type="password" id="senhaCliente" class="form-control" placeholder="Mínimo 6 caracteres" 
                       minlength="6" required>
                <small class="form-text">Crie uma senha para acompanhar seu pedido</small>
            </div>
            
            <div class="form-group">
                <label for="confirmarSenhaCliente">Confirmar Senha *</label>
                <input type="password" id="confirmarSenhaCliente" class="form-control" placeholder="Digite a senha novamente" 
                       minlength="6" required>
            </div>
            
            <div class="info-box" style="background-color: #e3f2fd; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 0.9em; color: #1976d2;">
                <i class="fas fa-info-circle"></i> 
                <strong>Você está criando uma conta!</strong> Após o pedido, você poderá fazer login com seu e-mail e senha para acompanhar seus pedidos.
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
        // Não selecionar automaticamente nenhum endereço no início

        html += `
            <div class="endereco-option" data-id="${endereco.idendereco}" data-endereco='${JSON.stringify(endereco).replace(/'/g, "&#39;")}'>
                <label class="endereco-label">
                    <input type="radio" name="endereco" value="${endereco.idendereco}" 
                           data-endereco-id="${endereco.idendereco}">
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
    
    // Configurar event listeners para endereços
    container.querySelectorAll('input[name="endereco"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const enderecoOption = this.closest('.endereco-option');
                const enderecoData = JSON.parse(enderecoOption.dataset.endereco.replace(/&#39;/g, "'"));
                selecionarEndereco(enderecoData.idendereco, enderecoData);
            }
        });
    });
    
    // Botão de confirmar só será habilitado quando um endereço for selecionado
    // Não habilitar automaticamente no início
    if (enderecoSelecionado) {
        document.getElementById('btnConfirmarPedido').disabled = false;
    } else {
        document.getElementById('btnConfirmarPedido').disabled = true;
    }
    
    // Garantir que nenhum endereço esteja selecionado no início
    enderecoSelecionado = null;
    distanciaCalculada = null;
    taxaEntregaSelecionada = null;
    
    // Atualizar resumo sem taxa de entrega
    renderizarResumoPedido();
}

// Selecionar endereço
function selecionarEndereco(id, endereco) {
    enderecoSelecionado = endereco;
    
    // Atualizar UI
    document.querySelectorAll('.endereco-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    const enderecoElement = document.querySelector(`[data-id="${id}"]`);
    if (enderecoElement) {
        enderecoElement.classList.add('selected');
    }
    
    // Calcular distância e taxa automaticamente
    calcularDistanciaETaxa(endereco);
    
    // Habilitar botão
    const btnConfirmar = document.getElementById('btnConfirmarPedido');
    if (btnConfirmar) {
        btnConfirmar.disabled = false;
    }
}

// Calcular distância e taxa de entrega automaticamente
async function calcularDistanciaETaxa(enderecoEntrega) {
    if (!enderecoEntrega) {
        distanciaCalculada = null;
        taxaEntregaSelecionada = null;
        renderizarResumoPedido();
        return;
    }

    if (tipoPedido === 'retirada') {
        taxaEntregaSelecionada = null;
        renderizarResumoPedido();
        return;
    }

    try {
        const enderecoRestaurante = `${ENDERECO_RESTAURANTE.logradouro}, ${ENDERECO_RESTAURANTE.numero}, ${ENDERECO_RESTAURANTE.bairro}, ${ENDERECO_RESTAURANTE.cidade}, ${ENDERECO_RESTAURANTE.estado}`;
        const enderecoDestino = `${enderecoEntrega.logradouro}, ${enderecoEntrega.numero}, ${enderecoEntrega.bairro}, ${enderecoEntrega.cidade}, ${enderecoEntrega.estado}`;

        const distancia = await calcularDistanciaEntreEnderecos(enderecoRestaurante, enderecoDestino);
        
        if (distancia !== null && distancia !== undefined && typeof distancia === 'number' && distancia > 0) {
            distanciaCalculada = distancia;
            encontrarTaxaPorDistancia(distancia);
        } else {
            aplicarTaxaFixaFallback();
        }
        
        // Garantir que sempre haja uma taxa quando houver endereço selecionado
        if (!taxaEntregaSelecionada) {
            aplicarTaxaFixaFallback();
        }
        
        renderizarResumoPedido();
        
    } catch (error) {
        aplicarTaxaFixaFallback();
        renderizarResumoPedido();
    }
}

// Calcular distância entre dois endereços usando Google Maps Distance Matrix API
async function calcularDistanciaEntreEnderecos(origem, destino) {
    try {
        const response = await fetch('/api/distancia/calcular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ origem, destino })
        });

        const data = await response.json();
        
        // Se a resposta contém erro, retornar null
        if (data.erro || !data.distancia) {
            return null;
        }

        // Verificar se a distância é válida
        if (data && typeof data.distancia === 'number' && data.distancia > 0) {
            return data.distancia;
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

// Aplicar taxa fixa quando a API falhar
function aplicarTaxaFixaFallback() {
    distanciaCalculada = 4.0;
    
    if (!taxasEntrega || taxasEntrega.length === 0) {
        taxaEntregaSelecionada = {
            id: 'fallback',
            distancia_km: 4.0,
            valor: 8.00,
            observacao: 'Taxa padrão (API indisponível)',
            ativo: true
        };
        return;
    }
    
    const taxasAtivas = taxasEntrega.filter(t => t.ativo !== false && t.ativo !== 0);
    
    if (taxasAtivas.length === 0) {
        taxaEntregaSelecionada = {
            id: 'fallback',
            distancia_km: 4.0,
            valor: 8.00,
            observacao: 'Taxa padrão (API indisponível)',
            ativo: true
        };
        return;
    }
    
    const taxaR$8 = taxasAtivas.find(t => Number(t.valor) === 8);
    if (taxaR$8) {
        taxaEntregaSelecionada = taxaR$8;
        return;
    }
    
    const taxa4km = taxasAtivas.find(t => Number(t.distancia_km) === 4 || Number(t.distancia_km) === 4.0);
    if (taxa4km) {
        taxaEntregaSelecionada = taxa4km;
        return;
    }
    
    const taxasOrdenadas = [...taxasAtivas].sort((a, b) => Number(a.distancia_km) - Number(b.distancia_km));
    if (taxasOrdenadas.length > 0) {
        taxaEntregaSelecionada = taxasOrdenadas[0];
        return;
    }
    
    taxaEntregaSelecionada = {
        id: 'fallback',
        distancia_km: 4.0,
        valor: 8.00,
        observacao: 'Taxa padrão (API indisponível)',
        ativo: true
    };
}

// Encontrar taxa de entrega baseada na distância
function encontrarTaxaPorDistancia(distancia) {
    if (!taxasEntrega || taxasEntrega.length === 0) {
        aplicarTaxaFixaFallback();
        return;
    }

    const taxasAtivas = taxasEntrega.filter(t => t.ativo !== false && t.ativo !== 0);
    
    if (taxasAtivas.length === 0) {
        aplicarTaxaFixaFallback();
        return;
    }

    const taxasQueCobrem = taxasAtivas.filter(taxa => {
        return distancia <= Number(taxa.distancia_km);
    });

    if (taxasQueCobrem.length === 0) {
        // Se nenhuma taxa cobre a distância, usar a maior taxa disponível
        const taxasOrdenadas = [...taxasAtivas].sort((a, b) => Number(b.distancia_km) - Number(a.distancia_km));
        if (taxasOrdenadas.length > 0) {
            taxaEntregaSelecionada = taxasOrdenadas[0];
        } else {
            aplicarTaxaFixaFallback();
        }
    } else {
        taxasQueCobrem.sort((a, b) => {
            const distA = Number(a.distancia_km);
            const distB = Number(b.distancia_km);
            return distA - distB;
        });
        taxaEntregaSelecionada = taxasQueCobrem[0];
    }
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

    carrinhoData.forEach((item, index) => {
        const itemTotal = item.precoFinal * item.quantidade;

        const observacaoSanitizada = escaparHTML(item.observacao || '');

        // Normalizar caminho da imagem
        let imagemHtml = '';
        if (item.imagem) {
            let imgPath = item.imagem.replace(/^https?:\/\/[^\/]+/, '');
            if (!imgPath.startsWith('/imgs/')) {
                imgPath = imgPath.replace(/^\/imgs\/imgs\//, '/imgs/');
                if (!imgPath.startsWith('/imgs/')) {
                    imgPath = `/imgs/${imgPath.replace(/^\//, '')}`;
                }
            }
            imagemHtml = `<img src="${imgPath}" alt="${item.nome}" class="summary-item-img" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        if (!imagemHtml) {
            imagemHtml = '<div class="summary-item-placeholder"><i class="fas fa-utensils"></i></div>';
        } else {
            imagemHtml += '<div class="summary-item-placeholder" style="display:none;"><i class="fas fa-utensils"></i></div>';
        }

        // Verificar se produto tem preco_pontos e se usuário está logado
        const podePagarComPontos = isUsuarioLogado() && item.preco_pontos && item.preco_pontos > 0;
        const pontosItem = item.preco_pontos * item.quantidade;
        // Sempre inicializar como 'dinheiro' por padrão
        const pagamentoAtual = pagamentoPorProduto[index] || 'dinheiro';
        
        // Inicializar pagamento por produto se não existir (sempre como 'dinheiro')
        if (!pagamentoPorProduto.hasOwnProperty(index)) {
            pagamentoPorProduto[index] = 'dinheiro';
        }
        
        html += `
            <div class="summary-item" data-index="${index}">
                ${imagemHtml}
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
    
    // Registrar listeners para seleção de pagamento por produto
    const selectsPagamento = container.querySelectorAll('.summary-item-pagamento-select');
    selectsPagamento.forEach(select => {
        select.addEventListener('change', (evento) => {
            const index = Number(evento.target.dataset.index);
            if (Number.isNaN(index) || !carrinhoData[index]) {
                return;
            }
            
            pagamentoPorProduto[index] = evento.target.value;
            renderizarResumoPedido(); // Re-renderizar para atualizar totais
        });
    });
    
    // Calcular valores considerando pagamento por produto
    const valores = calcularValoresPedido();
    const pontosNecessarios = calcularPontosNecessarios();
    
    // Atualizar totais
    document.getElementById('subtotal').textContent = `R$ ${formatarPreco(valores.subtotalDinheiro)}`;
    document.getElementById('taxaEntrega').textContent = `R$ ${formatarPreco(valores.taxaEntrega)}`;
    document.getElementById('totalPedido').textContent = `R$ ${formatarPreco(valores.totalFinal)}`;
    
    // Atualizar seção de pontos com prévia dos produtos (sempre, mesmo sem produtos)
    if (isUsuarioLogado()) {
        atualizarSecaoPontos();
    }

}

// Calcular taxa de entrega
function calcularTaxaEntrega(subtotal) {
    // Se for retirada, não há taxa
    if (tipoPedido === 'retirada') {
        return 0;
    }
    
    // Se há um endereço selecionado mas não há taxa, tentar aplicar fallback
    if (enderecoSelecionado && !taxaEntregaSelecionada) {
        aplicarTaxaFixaFallback();
    }
    
    // Se há uma taxa selecionada, usar o valor dela
    if (taxaEntregaSelecionada && taxaEntregaSelecionada.valor) {
        return Number(taxaEntregaSelecionada.valor);
    }
    
    // Se ainda não há taxa mas há endereço, aplicar fallback
    if (enderecoSelecionado) {
        aplicarTaxaFixaFallback();
        if (taxaEntregaSelecionada && taxaEntregaSelecionada.valor) {
            return Number(taxaEntregaSelecionada.valor);
        }
    }
    
    return 0;
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
            <div class="forma-pagamento-option ${isFirst ? 'selected' : ''}" data-id="${forma.idforma_pagamento}" data-forma='${JSON.stringify(forma).replace(/'/g, "&#39;")}'>
                <label class="forma-pagamento-label">
                    <input type="radio" name="formaPagamento" value="${forma.idforma_pagamento}" 
                           ${isFirst ? 'checked' : ''}
                           data-forma-id="${forma.idforma_pagamento}">
                    <div class="forma-pagamento-nome">${forma.nome}</div>
                </label>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Configurar event listeners para formas de pagamento
    container.querySelectorAll('input[name="formaPagamento"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const formaOption = this.closest('.forma-pagamento-option');
                const formaData = JSON.parse(formaOption.dataset.forma);
                selecionarFormaPagamento(formaData.idforma_pagamento, formaData);
            }
        });
    });
}

// Carregar pontos do usuário
async function carregarPontosUsuario() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        
        const response = await fetch('/api/usuarios/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const usuario = await response.json();
            pontosDisponiveis = usuario.pontos || 0;
            // Atualizar interface de pontos
            atualizarSecaoPontos();
            // Se houver carrinho, atualizar resumo também
            if (carrinhoData.length > 0) {
                renderizarResumoPedido();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar pontos:', error);
    }
}

// Calcular pontos necessários para produtos selecionados
function calcularPontosNecessarios() {
    let pontosTotal = 0;
    
    carrinhoData.forEach((item, index) => {
        // Se o produto foi selecionado para pagar com pontos
        if (pagamentoPorProduto[index] === 'pontos' && item.preco_pontos && item.preco_pontos > 0) {
            pontosTotal += item.preco_pontos * item.quantidade;
        }
    });
    
    return pontosTotal;
}

// Calcular valores do pedido (dinheiro e pontos)
function calcularValoresPedido() {
    let subtotalDinheiro = 0;
    let pontosNecessarios = 0;
    
    carrinhoData.forEach((item, index) => {
        const itemTotal = item.precoFinal * item.quantidade;
        
        if (pagamentoPorProduto[index] === 'pontos' && item.preco_pontos && item.preco_pontos > 0) {
            // Produto será pago com pontos
            pontosNecessarios += item.preco_pontos * item.quantidade;
        } else {
            // Produto será pago com dinheiro
            subtotalDinheiro += itemTotal;
        }
    });
    
    const taxaEntrega = calcularTaxaEntrega(subtotalDinheiro);
    const totalFinal = subtotalDinheiro + taxaEntrega;
    
    return {
        subtotalDinheiro,
        pontosNecessarios,
        taxaEntrega,
        totalFinal
    };
}

// Atualizar seção de pontos com prévia dos produtos
function atualizarSecaoPontos() {
    const pontosSection = document.getElementById('pontosSection');
    const pontosDisponiveisEl = document.getElementById('pontosDisponiveis');
    
    if (!pontosSection) {
        return;
    }
    
    // Filtrar produtos que podem ser pagos com pontos
    const produtosComPontos = carrinhoData
        .map((item, index) => ({ ...item, index }))
        .filter(item => item.preco_pontos && item.preco_pontos > 0);
    
    if (!isUsuarioLogado() || produtosComPontos.length === 0) {
        pontosSection.style.display = 'none';
        // Mesmo oculto, atualizar o saldo caso a seção seja exibida depois
        if (pontosDisponiveisEl) {
            pontosDisponiveisEl.textContent = pontosDisponiveis.toLocaleString('pt-BR');
        }
        return;
    }
    
    pontosSection.style.display = 'block';
    
    // Atualizar saldo disponível
    if (pontosDisponiveisEl) {
        pontosDisponiveisEl.textContent = pontosDisponiveis.toLocaleString('pt-BR');
    }
    
    // Calcular pontos necessários
    const pontosNecessarios = calcularPontosNecessarios();
    document.getElementById('pontosNecessarios').textContent = pontosNecessarios.toLocaleString('pt-BR');
    
    // Renderizar produtos com pontos
    const produtosContainer = document.getElementById('produtosPontosContainer');
    if (produtosContainer) {
        let htmlProdutos = '';
        
        produtosComPontos.forEach((item) => {
            const pontosItem = item.preco_pontos * item.quantidade;
            const pagamentoAtual = pagamentoPorProduto[item.index] || 'dinheiro'; // Sempre começa como 'dinheiro'
            const isSelected = pagamentoAtual === 'pontos';
            const temPontosSuficientes = pontosDisponiveis >= pontosItem;
            const isDisabled = !temPontosSuficientes && !isSelected; // Desabilitar apenas se não tiver pontos e não estiver selecionado
            
            // Normalizar caminho da imagem
            let imgPath = item.imagem || '';
            if (imgPath) {
                imgPath = imgPath.replace(/^https?:\/\/[^\/]+/, '');
                if (!imgPath.startsWith('/imgs/')) {
                    imgPath = imgPath.replace(/^\/imgs\/imgs\//, '/imgs/');
                    if (!imgPath.startsWith('/imgs/')) {
                        imgPath = `/imgs/${imgPath.replace(/^\//, '')}`;
                    }
                }
            }
            
            htmlProdutos += `
                <label class="produto-pontos-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-index="${item.index}">
                    <input type="checkbox" name="produtoPontos" value="${item.index}" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                    <div class="produto-pontos-card">
                        ${imgPath ? `
                            <img src="${imgPath}" alt="${item.nome}" class="produto-pontos-img" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="produto-pontos-placeholder" style="display:none;"><i class="fas fa-utensils"></i></div>
                        ` : `
                            <div class="produto-pontos-placeholder"><i class="fas fa-utensils"></i></div>
                        `}
                        <div class="produto-pontos-info">
                            <div class="produto-pontos-nome">${item.nome}</div>
                            <div class="produto-pontos-pontos">${pontosItem.toLocaleString('pt-BR')} pts</div>
                        </div>
                    </div>
                </label>
            `;
        });
        
        produtosContainer.innerHTML = htmlProdutos;
        
        // Registrar listeners para checkboxes
        produtosContainer.querySelectorAll('input[name="produtoPontos"]').forEach(checkbox => {
            checkbox.addEventListener('change', async function() {
                const index = Number(this.value);
                if (Number.isNaN(index) || !carrinhoData[index]) {
                    return;
                }
                
                // Se está tentando marcar para pagar com pontos, validar se tem pontos suficientes
                if (this.checked) {
                    const item = carrinhoData[index];
                    const pontosNecessariosItem = (item.preco_pontos || 0) * item.quantidade;
                    
                    // Recarregar pontos para garantir dados atualizados
                    if (isUsuarioLogado()) {
                        await carregarPontosUsuario();
                    }
                    
                    // Validar se tem pontos suficientes para este item
                    if (pontosDisponiveis < pontosNecessariosItem) {
                        this.checked = false; // Desmarcar checkbox
                        showWarning(`Você não tem pontos suficientes para este produto. Faltam ${(pontosNecessariosItem - pontosDisponiveis).toLocaleString('pt-BR')} pontos.`);
                        return;
                    }
                    
                    pagamentoPorProduto[index] = 'pontos';
                } else {
                    pagamentoPorProduto[index] = 'dinheiro';
                }
                
                renderizarResumoPedido(); // Re-renderizar para atualizar
            });
        });
    }
    
    // Atualizar mensagem (apenas se não tiver pontos suficientes)
    const pontosDescricao = document.getElementById('pontosDescricao');
    if (pontosDescricao) {
        if (pontosNecessarios > 0 && pontosDisponiveis < pontosNecessarios) {
            pontosDescricao.textContent = `Você precisa de mais ${(pontosNecessarios - pontosDisponiveis).toLocaleString('pt-BR')} pontos.`;
            pontosDescricao.style.color = '#f59e0b';
            pontosDescricao.style.display = 'block';
        } else {
            // Ocultar mensagem quando tiver pontos suficientes ou não houver produtos selecionados
            pontosDescricao.style.display = 'none';
        }
    }
}

// Taxas de entrega
async function carregarTaxasEntrega() {
    try {
        const response = await fetch('/api/taxas-entrega');
        if (!response.ok) {
            throw new Error('Erro ao carregar taxas de entrega');
        }
        const data = await response.json();
        taxasEntrega = Array.isArray(data) ? data : [];
        
        // Se houver um endereço já selecionado, recalcular a taxa
        if (enderecoSelecionado && tipoPedido === 'entrega') {
            calcularDistanciaETaxa(enderecoSelecionado);
        }
    } catch (error) {
        taxasEntrega = [];
    }
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
    // Radio buttons de tipo de pedido (entrega/retirada)
    document.querySelectorAll('input[name="tipoPedido"]').forEach(radio => {
        radio.addEventListener('change', function() {
            tipoPedido = this.value;
            atualizarInterfaceTipoPedido();
        });
    });

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
    if (cepInput) {
        // Remover event listeners anteriores se existirem
        const novoCepInput = cepInput.cloneNode(true);
        cepInput.parentNode.replaceChild(novoCepInput, cepInput);
        
        novoCepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value;

            // Buscar CEP automaticamente quando completo (9 caracteres com hífen)
            if (value.length === 9) {
                // Pequeno delay para garantir que o valor foi atualizado
                setTimeout(() => {
                    buscarCEP(value);
                }, 100);
            }
        });
        
        // Também buscar ao perder o foco se o CEP estiver completo
        novoCepInput.addEventListener('blur', function(e) {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length === 8) {
                buscarCEP(e.target.value);
            }
        });
    }

    // Removido: campo de seleção manual de distância
    
    // Inicializar interface baseada no tipo de pedido padrão
    atualizarInterfaceTipoPedido();
}

// Atualizar interface baseado no tipo de pedido
function atualizarInterfaceTipoPedido() {
    const secaoEndereco = document.getElementById('secaoEndereco');
    
    if (tipoPedido === 'retirada') {
        // Esconder seção de endereço
        secaoEndereco.classList.add('hidden');
        
        // Limpar seleção de endereço
        enderecoSelecionado = null;
        distanciaCalculada = null;
        taxaEntregaSelecionada = null;
        
        // Habilitar botão de confirmar (não precisa de endereço)
        document.getElementById('btnConfirmarPedido').disabled = false;
        
        // Atualizar resumo (sem taxa de entrega)
        renderizarResumoPedido();
    } else {
        // Mostrar seção de endereço
        secaoEndereco.classList.remove('hidden');
        
        // Desabilitar botão até selecionar endereço
        if (!enderecoSelecionado) {
            document.getElementById('btnConfirmarPedido').disabled = true;
        }
        
        // Atualizar resumo
        renderizarResumoPedido();
    }
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
    
    // Limpar estados visuais dos campos
    const cepInput = document.getElementById('cepEndereco');
    if (cepInput) {
        cepInput.style.borderColor = '';
        cepInput.style.backgroundImage = 'none';
        cepInput.style.paddingRight = '';
    }
    
    // Remover mensagens de feedback
    const mensagemCEP = document.getElementById('cepMensagem');
    if (mensagemCEP) {
        mensagemCEP.remove();
    }
}

// Buscar CEP via API
async function buscarCEP(cep) {
    const cepInput = document.getElementById('cepEndereco');
    if (!cepInput) return;
    
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Validar CEP (deve ter 8 dígitos)
    if (cepLimpo.length !== 8) {
        return;
    }
    
    // Adicionar estado de loading
    cepInput.style.borderColor = '#e8b705';
    cepInput.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23e8b705\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M21 12a9 9 0 1 1-6.219-8.56\'/%3E%3C/svg%3E")';
    cepInput.style.backgroundRepeat = 'no-repeat';
    cepInput.style.backgroundPosition = 'right 0.75rem center';
    cepInput.style.paddingRight = '2.5rem';
    
    try {
        // Criar um timeout para a requisição (10 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Usar URL da ViaCEP (sem callback para evitar problemas)
        const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-cache',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Verificar se a resposta é OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Verificar se há erro na resposta
        if (data.erro === true || (data.erro && data.erro !== false)) {
            // CEP não encontrado
            cepInput.style.borderColor = '#dc3545';
            cepInput.style.backgroundImage = 'none';
            cepInput.style.paddingRight = '0.75rem';
            mostrarMensagemCEP('CEP não encontrado. Por favor, verifique e tente novamente.', 'erro');
            return;
        }

        // Verificar se os dados essenciais estão presentes
        if (!data.localidade || !data.uf) {
            cepInput.style.borderColor = '#dc3545';
            cepInput.style.backgroundImage = 'none';
            cepInput.style.paddingRight = '0.75rem';
            mostrarMensagemCEP('CEP encontrado, mas dados incompletos. Preencha manualmente.', 'erro');
            return;
        }

        // Preencher campos automaticamente
        const logradouroInput = document.getElementById('logradouroEndereco');
        const bairroInput = document.getElementById('bairroEndereco');
        const cidadeInput = document.getElementById('cidadeEndereco');
        const estadoInput = document.getElementById('estadoEndereco');
        
        if (logradouroInput) logradouroInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';
        if (cidadeInput) cidadeInput.value = data.localidade || '';
        if (estadoInput) estadoInput.value = data.uf || '';
        
        // Feedback visual de sucesso
        cepInput.style.borderColor = '#28a745';
        cepInput.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2328a745\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'20 6 9 17 4 12\'/%3E%3C/svg%3E")';
        cepInput.style.backgroundRepeat = 'no-repeat';
        cepInput.style.backgroundPosition = 'right 0.75rem center';
        cepInput.style.paddingRight = '2.5rem';
        
        // Remover feedback após 2 segundos
        setTimeout(() => {
            cepInput.style.borderColor = '';
            cepInput.style.backgroundImage = 'none';
            cepInput.style.paddingRight = '0.75rem';
        }, 2000);
        
        // Focar no campo de número se logradouro foi preenchido
        const numeroInput = document.getElementById('numeroEndereco');
        if (numeroInput && logradouroInput && logradouroInput.value) {
            numeroInput.focus();
        }
        
        mostrarMensagemCEP('Endereço encontrado!', 'sucesso');
        
    } catch (error) {
        // Verificar se foi timeout
        if (error.name === 'AbortError') {
            cepInput.style.borderColor = '#dc3545';
            cepInput.style.backgroundImage = 'none';
            cepInput.style.paddingRight = '0.75rem';
            mostrarMensagemCEP('Tempo de busca excedido. Verifique sua conexão e tente novamente.', 'erro');
            return;
        }
        
        // Tentar com URL alternativa (sem parâmetros extras)
        try {
            const controllerAlt = new AbortController();
            const timeoutIdAlt = setTimeout(() => controllerAlt.abort(), 8000);
            
            const urlAlt = `https://viacep.com.br/ws/${cepLimpo}/json/`;
            const responseAlt = await fetch(urlAlt, {
                signal: controllerAlt.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutIdAlt);
            
            if (responseAlt.ok) {
                const dataAlt = await responseAlt.json();
                
                if (!dataAlt.erro && dataAlt.localidade) {
                    // Preencher com dados alternativos
                    const logradouroInput = document.getElementById('logradouroEndereco');
                    const bairroInput = document.getElementById('bairroEndereco');
                    const cidadeInput = document.getElementById('cidadeEndereco');
                    const estadoInput = document.getElementById('estadoEndereco');
                    
                    if (logradouroInput) logradouroInput.value = dataAlt.logradouro || '';
                    if (bairroInput) bairroInput.value = dataAlt.bairro || '';
                    if (cidadeInput) cidadeInput.value = dataAlt.localidade || '';
                    if (estadoInput) estadoInput.value = dataAlt.uf || '';
                    
                    cepInput.style.borderColor = '#28a745';
                    cepInput.style.backgroundImage = 'none';
                    cepInput.style.paddingRight = '0.75rem';
                    mostrarMensagemCEP('Endereço encontrado!', 'sucesso');
                    return;
                }
            }
        } catch (errorAlt) {
            // Erro silencioso na tentativa alternativa
        }
        
        cepInput.style.borderColor = '#dc3545';
        cepInput.style.backgroundImage = 'none';
        cepInput.style.paddingRight = '0.75rem';
        
        // Mensagem mais específica baseada no tipo de erro
        let mensagemErro = 'Erro ao buscar CEP. Verifique sua conexão e tente novamente.';
        if (error.message && error.message.includes('Failed to fetch')) {
            mensagemErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message && error.message.includes('network')) {
            mensagemErro = 'Erro de rede. Tente novamente em alguns instantes.';
        }
        
        mostrarMensagemCEP(mensagemErro, 'erro');
    }
}

// Mostrar mensagem de feedback para busca de CEP
function mostrarMensagemCEP(mensagem, tipo) {
    // Remover mensagem anterior se existir
    const mensagemAnterior = document.getElementById('cepMensagem');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Criar elemento de mensagem
    const mensagemEl = document.createElement('div');
    mensagemEl.id = 'cepMensagem';
    mensagemEl.style.cssText = `
        margin-top: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        ${tipo === 'sucesso' 
            ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
            : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;
    mensagemEl.textContent = mensagem;
    
    // Inserir após o campo CEP
    const cepInput = document.getElementById('cepEndereco');
    const formGroup = cepInput.closest('.form-group');
    if (formGroup) {
        formGroup.appendChild(mensagemEl);
        
        // Remover mensagem após 3 segundos (se for sucesso)
        if (tipo === 'sucesso') {
            setTimeout(() => {
                mensagemEl.style.transition = 'opacity 0.3s ease';
                mensagemEl.style.opacity = '0';
                setTimeout(() => mensagemEl.remove(), 300);
            }, 3000);
        }
    }
}

// Salvar novo endereço
async function salvarNovoEndereco(event) {
    event.preventDefault();

    // Validar campos obrigatórios
    const nome = document.getElementById('nomeEndereco').value.trim();
    const cep = document.getElementById('cepEndereco').value.replace(/\D/g, '');
    const logradouro = document.getElementById('logradouroEndereco').value.trim();
    const numero = document.getElementById('numeroEndereco').value.trim();
    const bairro = document.getElementById('bairroEndereco').value.trim();
    const cidade = document.getElementById('cidadeEndereco').value.trim();
    const estado = document.getElementById('estadoEndereco').value.trim().toUpperCase();

    if (!nome || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        showWarning('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    if (cep.length !== 8) {
        showWarning('CEP inválido. Deve conter 8 dígitos.');
        return;
    }

    if (estado.length !== 2) {
        showWarning('Estado inválido. Deve conter 2 letras (ex: SP).');
        return;
    }

    const endereco = {
        apelido: nome, // O backend espera 'apelido', não 'nome'
        cep: cep, // Backend espera CEP sem hífen (8 dígitos)
        logradouro,
        numero,
        complemento: document.getElementById('complementoEndereco').value.trim() || '',
        bairro,
        cidade,
        estado,
        referencia: '', // Campo opcional
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
                // Recarregar página para atualizar endereços e recalcular distância
                window.location.reload();
            } else {
                // Tentar obter mensagem de erro do backend
                const erroData = await response.json().catch(() => ({ erro: 'Erro ao salvar endereço' }));
                showError(erroData.erro || 'Erro ao salvar endereço');
            }
        } catch (error) {
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
    // Recarregar página para atualizar endereços e recalcular distância
    window.location.reload();
}

// Função para ativar/desativar loading no botão de confirmar
function setLoadingConfirmar(loading) {
    const btnConfirmar = document.getElementById('btnConfirmarPedido');
    if (!btnConfirmar) return;
    
    if (loading) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando pedido...';
        btnConfirmar.classList.add('loading');
    } else {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Pedido';
        btnConfirmar.classList.remove('loading');
    }
}

// Confirmar pedido
async function confirmarPedido() {
    try {
        // Ativar loading
        setLoadingConfirmar(true);
        
        // Validar dados do cliente (se não estiver logado)
        if (!isUsuarioLogado()) {
            const nomeCliente = document.getElementById('nomeCliente')?.value?.trim();
            const telefoneCliente = document.getElementById('telefoneCliente')?.value?.trim();
            const senhaCliente = document.getElementById('senhaCliente')?.value;
            const confirmarSenhaCliente = document.getElementById('confirmarSenhaCliente')?.value;
            
            if (!nomeCliente) {
                setLoadingConfirmar(false);
                showWarning('Por favor, preencha seu nome completo');
                return;
            }
            
            if (!telefoneCliente) {
                setLoadingConfirmar(false);
                showWarning('Por favor, preencha seu telefone');
                return;
            }
            
            const emailCliente = document.getElementById('emailCliente')?.value?.trim();
            if (!emailCliente) {
                setLoadingConfirmar(false);
                showWarning('Por favor, preencha seu e-mail');
                return;
            }
            
            if (!senhaCliente || senhaCliente.length < 6) {
                setLoadingConfirmar(false);
                showWarning('Por favor, crie uma senha com no mínimo 6 caracteres');
                return;
            }
            
            if (senhaCliente !== confirmarSenhaCliente) {
                setLoadingConfirmar(false);
                showWarning('As senhas não coincidem. Por favor, verifique e tente novamente.');
                return;
            }
        }
        
        // Validar dados
        if (tipoPedido === 'entrega' && !enderecoSelecionado) {
            setLoadingConfirmar(false);
            showWarning('Selecione um endereço de entrega');
            return;
        }

        if (carrinhoData.length === 0) {
            setLoadingConfirmar(false);
            showWarning('Seu carrinho está vazio');
            return;
        }

        // Recarregar pontos do usuário antes de validar (garantir dados atualizados)
        if (isUsuarioLogado()) {
            await carregarPontosUsuario();
        }
        
        // Calcular valores considerando pagamento por produto
        const valores = calcularValoresPedido();
        const pontosNecessarios = calcularPontosNecessarios();
        
        // Validar pontos se houver produtos selecionados para pagar com pontos
        if (pontosNecessarios > 0) {
            if (pontosDisponiveis < pontosNecessarios) {
                setLoadingConfirmar(false);
                showWarning(`Você não tem pontos suficientes. Faltam ${(pontosNecessarios - pontosDisponiveis).toLocaleString('pt-BR')} pontos.`);
                return;
            }
        }
        
        // Validar forma de pagamento se houver produtos para pagar com dinheiro
        if (valores.subtotalDinheiro > 0 && !formaPagamentoSelecionada) {
            setLoadingConfirmar(false);
            showWarning('Selecione uma forma de pagamento para os produtos em dinheiro.');
            return;
        }

        // Validar taxa de entrega apenas se for entrega
        if (tipoPedido === 'entrega' && taxasEntrega.length > 0 && !taxaEntregaSelecionada) {
            setLoadingConfirmar(false);
            showWarning('Aguarde o cálculo da distância ou selecione um endereço válido.');
            return;
        }

        // Coletar observações
        const observacoes = document.getElementById('observacoesPedido').value;
        
        // Coletar dados do cliente (se não estiver logado)
        let dadosCliente = {};
        if (!isUsuarioLogado()) {
            dadosCliente = {
                nome: document.getElementById('nomeCliente').value.trim(),
                telefone: document.getElementById('telefoneCliente').value.trim(),
                email: document.getElementById('emailCliente').value.trim() || null,
                senha: document.getElementById('senhaCliente').value
            };
        }
        
        // Preparar dados do pedido
        const pedidoData = {
            tipo_entrega: tipoPedido, // 'entrega' ou 'retirada'
            idendereco: tipoPedido === 'entrega' && enderecoSelecionado ? enderecoSelecionado.idendereco : null,
            idforma_pagamento: valores.subtotalDinheiro > 0 ? (formaPagamentoSelecionada ? formaPagamentoSelecionada.idforma_pagamento : null) : null,
            pagamento_pontos: pontosNecessarios > 0, // Flag indicando se há pagamento com pontos
            pontos_usados: pontosNecessarios,
            itens: carrinhoData.map((item, index) => {
                const observacaoItem = item.observacao ? item.observacao.trim() : '';
                return {
                    idproduto: item.idproduto,
                    quantidade: item.quantidade,
                    preco_unitario: item.precoFinal,
                    observacao: observacaoItem.length > 0 ? observacaoItem : null,
                    opcionais: item.opcionais || [],
                    pagar_com_pontos: pagamentoPorProduto[index] === 'pontos' && item.preco_pontos && item.preco_pontos > 0
                };
            }),
            valor_total: valores.totalFinal, // Total sempre inclui taxa de entrega
            valor_entrega: valores.taxaEntrega, // Taxa sempre cobrada
            distancia_km: tipoPedido === 'entrega' && distanciaCalculada ? Number(distanciaCalculada) : null,
            observacoes: observacoes,
            enderecoCompleto: tipoPedido === 'entrega' && enderecoSelecionado ? enderecoSelecionado : null, // Para endereços temporários
            dadosCliente: Object.keys(dadosCliente).length > 0 ? dadosCliente : null // Dados do cliente não logado
        };

        // Enviar pedido para o backend (logado ou não)
        if (isUsuarioLogado()) {
            // Usuário logado - usar rota autenticada
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
                // Token inválido: usar rota pública (mantém loading ativo)
                await enviarPedidoPublico(pedidoData);
                return;
            }

            const resultado = await response.json();

            if (response.ok) {
                // Se pagou com pontos, recarregar pontos do usuário
                if (resultado?.pontos_usados && resultado.pontos_usados > 0) {
                    await carregarPontosUsuario();
                }
                processarPedidoSucesso(resultado?.pedidoId, pedidoData);
            } else {
                // Desativar loading em caso de erro
                setLoadingConfirmar(false);
                // Mostrar erro específico do backend
                const erroData = await response.json().catch(() => ({ erro: 'Erro desconhecido' }));
                showError(erroData.erro || 'Erro ao confirmar pedido. Tente novamente.');
            }
        } else {
            // Usuário não logado - usar rota pública
            await enviarPedidoPublico(pedidoData);
        }

    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        // Desativar loading em caso de erro
        setLoadingConfirmar(false);
        showError('Erro ao confirmar pedido. Tente novamente.');
    }
}

// Enviar pedido usando rota pública (sem autenticação)
async function enviarPedidoPublico(pedidoData) {
    try {
        const response = await fetch('/api/pedidos/publico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoData)
        });

        const resultado = await response.json();

        if (response.ok) {
            processarPedidoSucesso(resultado?.pedidoId, pedidoData);
        } else {
            // Desativar loading em caso de erro
            setLoadingConfirmar(false);
            // Se falhar, salvar localmente como fallback
            console.error('Erro ao enviar pedido público:', resultado.erro);
            showWarning('Erro ao confirmar pedido: ' + (resultado.erro || 'Erro desconhecido') + '. O pedido será salvo localmente.');
            salvarPedidoLocal(pedidoData);
        }
    } catch (error) {
        // Desativar loading em caso de erro
        setLoadingConfirmar(false);
        console.error('Erro ao enviar pedido público:', error);
        showWarning('Erro ao confirmar pedido. O pedido será salvo localmente.');
        salvarPedidoLocal(pedidoData);
    }
}

// Processar sucesso do pedido (logado ou não)
async function processarPedidoSucesso(pedidoId, pedidoData) {
    // Limpar carrinho
    localStorage.removeItem('julaosBurger_carrinho');
    localStorage.removeItem('cart');
    
    // Abrir WhatsApp com mensagem do pedido
    abrirWhatsAppPedido(pedidoId, pedidoData);
    
    // Se não estiver logado mas criou conta, tentar fazer login automático
    if (!isUsuarioLogado() && pedidoData.dadosCliente) {
        try {
            const email = pedidoData.dadosCliente.email;
            const senha = pedidoData.dadosCliente.senha;
            
            // Se tiver email, tentar fazer login
            if (email && senha) {
                const response = await fetch('/api/usuarios/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });
                
                if (response.ok) {
                    const resultado = await response.json();
                    // Garantir que o token do usuário logado seja sempre o mais recente
                    localStorage.setItem('token', resultado.token);
                    localStorage.setItem('jwt_token', resultado.token);
                    // Redirecionar para acompanhamento do pedido
                    const rotaAcompanhamento = pedidoId 
                        ? `/pedidos_cliente?pedido=${pedidoId}`
                        : '/pedidos_cliente';
                    setTimeout(() => {
                        window.location.href = rotaAcompanhamento;
                    }, 500);
                    return;
                }
            }
        } catch (error) {
            console.error('Erro ao fazer login automático:', error);
        }
    }
    
    // Redirecionar para a tela de acompanhamento do pedido (se logado) ou página de confirmação
    if (isUsuarioLogado() && pedidoId) {
        const rotaAcompanhamento = `/pedidos_cliente?pedido=${pedidoId}`;
        setTimeout(() => {
            window.location.href = rotaAcompanhamento;
        }, 500);
    } else {
        // Cliente não logado - mostrar mensagem de sucesso
        showSuccess('Pedido confirmado com sucesso! Número do pedido: #' + (pedidoId ? String(pedidoId).padStart(3, '0') : 'aguardando') + '. Você pode fazer login com seu email e senha para acompanhar o pedido.');
        setTimeout(() => {
            window.location.href = '/login_cadastro.html';
        }, 1000);
    }
}

// Salvar pedido localmente (para usuários não logados - fallback)
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

    // Mesmo em modo offline/falha de backend, ainda avisar a loja via WhatsApp
    try {
        abrirWhatsAppPedido(null, pedidoData);
    } catch (e) {
        console.error('Erro ao tentar abrir WhatsApp para pedido salvo localmente:', e);
    }

    // Limpar carrinho
    localStorage.removeItem('julaosBurger_carrinho');
    localStorage.removeItem('cart');
    
    // Redirecionar para página de confirmação / login
    showSuccess('Pedido salvo! Faça login para acompanhar seu pedido.');
    setTimeout(() => {
        window.location.href = '/login_cadastro.html';
    }, 2000);
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

// Gerar mensagem para WhatsApp
function gerarMensagemWhatsApp(pedidoId, pedidoData) {
    const numeroPedido = pedidoId ? `#${String(pedidoId).padStart(3, '0')}` : '(aguardando confirmação)';
    const tipoEntrega = pedidoData.tipo_entrega === 'retirada' ? 'Retirada no Local' : 'Entrega';
    
    let mensagem = `🍔 *PEDIDO REALIZADO - JULÃO'S BURGER*\n\n`;
    mensagem += `Pedido ${numeroPedido}\n\n`;
    
    // Itens do pedido - usar dados do carrinho que ainda estão na memória
    mensagem += `*ITENS:*\n`;
    carrinhoData.forEach((item, index) => {
        const nomeProduto = item.nome || `Produto ${index + 1}`;
        const quantidade = item.quantidade || 1;
        const preco = item.precoFinal || 0;
        mensagem += `${quantidade}x ${nomeProduto} - R$ ${formatarPreco(preco * quantidade)}\n`;
        
        // Opcionais
        if (item.opcionais && item.opcionais.length > 0) {
            item.opcionais.forEach(opcional => {
                const qtdOpcional = opcional.quantidade || 1;
                const nomeOpcional = opcional.nome || 'Opcional';
                const precoOpcional = opcional.preco || 0;
                mensagem += `  ➕ ${qtdOpcional}x ${nomeOpcional}${precoOpcional > 0 ? ` (+R$ ${formatarPreco(precoOpcional * qtdOpcional)})` : ''}\n`;
            });
        }
        
        // Observação do item
        if (item.observacao) {
            mensagem += `  📝 Obs: ${item.observacao}\n`;
        }
    });
    
    mensagem += `\n`;
    
    // Tipo de entrega
    mensagem += `*TIPO:* ${tipoEntrega}\n`;
    
    // Endereço (se for entrega)
    if (pedidoData.tipo_entrega === 'entrega' && pedidoData.enderecoCompleto) {
        const end = pedidoData.enderecoCompleto;
        mensagem += `*ENDEREÇO:*\n`;
        mensagem += `${end.logradouro}, ${end.numero}`;
        if (end.complemento) mensagem += ` - ${end.complemento}`;
        mensagem += `\n${end.bairro}, ${end.cidade} - ${end.estado}`;
        if (end.cep) mensagem += `\nCEP: ${end.cep}`;
        mensagem += `\n\n`;
    } else if (pedidoData.tipo_entrega === 'retirada') {
        mensagem += `*RETIRADA NO ESTABELECIMENTO*\n\n`;
    }
    
    // Forma de pagamento
    const formaPagamento = formaPagamentoSelecionada?.nome || 'Não informado';
    mensagem += `*FORMA DE PAGAMENTO:* ${formaPagamento}\n\n`;
    
    // Totais
    const subtotal = carrinhoData.reduce((total, item) => {
        const preco = item.precoFinal || 0;
        const quantidade = item.quantidade || 1;
        const totalOpcionais = (item.opcionais || []).reduce((sub, opc) => {
            return sub + ((opc.preco || 0) * (opc.quantidade || 1));
        }, 0);
        return total + ((preco * quantidade) + totalOpcionais);
    }, 0);
    
    mensagem += `*RESUMO:*\n`;
    mensagem += `Subtotal: R$ ${formatarPreco(subtotal)}\n`;
    if (pedidoData.valor_entrega > 0) {
        mensagem += `Taxa de Entrega: R$ ${formatarPreco(pedidoData.valor_entrega)}\n`;
    }
    mensagem += `*TOTAL: R$ ${formatarPreco(pedidoData.valor_total)}*\n\n`;
    
    // Observações gerais
    if (pedidoData.observacoes) {
        mensagem += `*OBSERVAÇÕES:*\n${pedidoData.observacoes}\n\n`;
    }
    
    mensagem += `Obrigado pela preferência! 🍔❤️`;
    
    return mensagem;
}

// Abrir WhatsApp com mensagem do pedido
function abrirWhatsAppPedido(pedidoId, pedidoData) {
    try {
        const mensagem = gerarMensagemWhatsApp(pedidoId, pedidoData);
        const mensagemEncoded = encodeURIComponent(mensagem);
        const urlWhatsApp = `https://wa.me/${WHATSAPP_RESTAURANTE}?text=${mensagemEncoded}`;

        // Detectar iOS (iPhone / iPad) – Safari é mais restritivo com popups
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

        if (isIOS) {
            // Em iOS, abrir na MESMA aba reduz muito a chance de bloqueio
            window.location.href = urlWhatsApp;
        } else {
            // Em outros dispositivos, tentar nova aba primeiro
            const novaJanela = window.open(urlWhatsApp, '_blank');

            // Se o navegador bloquear o popup, cair para mesma aba
            if (!novaJanela || novaJanela.closed || typeof novaJanela.closed === 'undefined') {
                window.location.href = urlWhatsApp;
            }
        }
    } catch (error) {
        // Se houver erro, não bloquear o fluxo do pedido
        console.error('Erro ao abrir WhatsApp:', error);
    }
}
