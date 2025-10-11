// ========================================
// SISTEMA DE PERFIL E ENDEREÇOS
// Julão's Burger
// ========================================

// Estado global
let usuarioAtual = null;
let enderecos = [];
let enderecoEditando = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    carregarDadosUsuario();
    configurarEventListeners();
});

// Verificar se o usuário está autenticado
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login_cadastro.html';
        return;
    }
    
    // Decodificar token para obter dados do usuário
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        usuarioAtual = {
            idusuario: payload.id,
            email: payload.email,
            tipo: payload.type
        };
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login_cadastro.html';
    }
}

// ========================================
// NAVEGAÇÃO ENTRE ABAS
// ========================================

function configurarEventListeners() {
    // Navegação entre abas
    const menuItems = document.querySelectorAll('.perfil-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            mudarAba(tabName);
        });
    });

    // Formulário de dados
    document.getElementById('formDados').addEventListener('submit', salvarDados);

    // Formulário de senha
    document.getElementById('formSenha').addEventListener('submit', alterarSenha);

    // Formulário de endereço
    document.getElementById('formEndereco').addEventListener('submit', salvarEndereco);

    // Botões de endereço
    document.getElementById('btnNovoEndereco').addEventListener('click', abrirModalNovoEndereco);
    document.getElementById('fecharModalEndereco').addEventListener('click', fecharModalEndereco);
    document.getElementById('cancelarEndereco').addEventListener('click', fecharModalEndereco);

    // Buscar CEP
    document.getElementById('btnBuscarCep').addEventListener('click', buscarCEP);
    
    // Máscara de CEP
    document.getElementById('enderecoCep').addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length > 5) {
            valor = valor.substring(0, 5) + '-' + valor.substring(5, 8);
        }
        e.target.value = valor;
    });

    // Fechar modal ao clicar fora
    document.getElementById('modalEndereco').addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalEndereco();
        }
    });
}

function mudarAba(tabName) {
    // Atualizar menu ativo
    document.querySelectorAll('.perfil-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Atualizar tab ativa
    document.querySelectorAll('.perfil-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Carregar dados específicos da aba
    if (tabName === 'enderecos') {
        carregarEnderecos();
    }
}

// ========================================
// CARREGAR DADOS DO USUÁRIO
// ========================================

async function carregarDadosUsuario() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/usuarios/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const usuario = await response.json();
            usuarioAtual = usuario;
            
            // Atualizar UI
            document.getElementById('perfilNome').textContent = usuario.nome;
            document.getElementById('perfilEmail').textContent = usuario.email;
            
            // Preencher formulário
            document.getElementById('nome').value = usuario.nome;
            document.getElementById('email').value = usuario.email;
            
        } else if (response.status === 401) {
            window.location.href = '/login_cadastro.html';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarToast('Erro ao carregar dados', 'error');
    }
}

// ========================================
// SALVAR DADOS DO USUÁRIO
// ========================================

async function salvarDados(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    
    if (!nome) {
        mostrarToast('Por favor, preencha o nome', 'error');
        return;
    }

    try {
        const response = await fetch('/api/usuarios/perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ nome })
        });

        if (response.ok) {
            const usuario = await response.json();
            usuarioAtual = usuario;
            
            // Atualizar localStorage
            localStorage.setItem('usuario', JSON.stringify(usuario));
            
            // Atualizar UI
            document.getElementById('perfilNome').textContent = usuario.nome;
            
            mostrarToast('Dados atualizados com sucesso!', 'success');
        } else {
            const erro = await response.json();
            mostrarToast(erro.erro || 'Erro ao atualizar dados', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        mostrarToast('Erro ao salvar dados', 'error');
    }
}

// ========================================
// ALTERAR SENHA
// ========================================

async function alterarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarToast('Preencha todos os campos', 'error');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarToast('A nova senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarToast('As senhas não conferem', 'error');
        return;
    }

    try {
        const response = await fetch('/api/usuarios/alterar-senha', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                senhaAtual,
                novaSenha
            })
        });

        if (response.ok) {
            mostrarToast('Senha alterada com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('formSenha').reset();
        } else {
            const erro = await response.json();
            mostrarToast(erro.erro || 'Erro ao alterar senha', 'error');
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        mostrarToast('Erro ao alterar senha', 'error');
    }
}

// ========================================
// ENDEREÇOS - LISTAR
// ========================================

async function carregarEnderecos() {
    const lista = document.getElementById('enderecosLista');
    
    // Mostrar loading
    lista.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando endereços...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/enderecos', {
            credentials: 'include'
        });

        if (response.ok) {
            enderecos = await response.json();
            renderizarEnderecos();
        } else {
            throw new Error('Erro ao carregar endereços');
        }
    } catch (error) {
        console.error('Erro ao carregar endereços:', error);
        lista.innerHTML = `
            <div class="endereco-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar endereços</h3>
                <p>Tente novamente mais tarde</p>
            </div>
        `;
    }
}

function renderizarEnderecos() {
    const lista = document.getElementById('enderecosLista');
    
    if (enderecos.length === 0) {
        lista.innerHTML = `
            <div class="endereco-empty">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Nenhum endereço cadastrado</h3>
                <p>Adicione um endereço para facilitar seus pedidos</p>
                <button class="btn-primary" onclick="abrirModalNovoEndereco()">
                    <i class="fas fa-plus"></i>
                    Adicionar Endereço
                </button>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = enderecos.map(endereco => `
        <div class="endereco-card ${endereco.principal ? 'principal' : ''}">
            ${endereco.principal ? '<span class="endereco-badge">Principal</span>' : ''}
            
            <div class="endereco-header">
                <div class="endereco-icon">
                    <i class="fas ${getIconeEndereco(endereco.apelido)}"></i>
                </div>
                <div class="endereco-titulo">
                    <h4>${endereco.apelido}</h4>
                    <p>${endereco.cep}</p>
                </div>
            </div>
            
            <div class="endereco-info">
                <div class="endereco-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${endereco.logradouro}, ${endereco.numero}</span>
                </div>
                ${endereco.complemento ? `
                    <div class="endereco-info-item">
                        <i class="fas fa-building"></i>
                        <span>${endereco.complemento}</span>
                    </div>
                ` : ''}
                <div class="endereco-info-item">
                    <i class="fas fa-map"></i>
                    <span>${endereco.bairro} - ${endereco.cidade}/${endereco.estado}</span>
                </div>
                ${endereco.referencia ? `
                    <div class="endereco-info-item">
                        <i class="fas fa-info-circle"></i>
                        <span>${endereco.referencia}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="endereco-acoes">
                ${!endereco.principal ? `
                    <button class="btn-endereco btn-principal" onclick="definirEnderecoPrincipal(${endereco.idendereco})">
                        <i class="fas fa-star"></i>
                        Principal
                    </button>
                ` : ''}
                <button class="btn-endereco btn-editar" onclick="editarEndereco(${endereco.idendereco})">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn-endereco btn-excluir" onclick="excluirEndereco(${endereco.idendereco})">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function getIconeEndereco(apelido) {
    const apelidoLower = apelido.toLowerCase();
    
    if (apelidoLower.includes('casa')) return 'fa-home';
    if (apelidoLower.includes('trabalho')) return 'fa-briefcase';
    if (apelidoLower.includes('apartamento') || apelidoLower.includes('apto')) return 'fa-building';
    if (apelidoLower.includes('escritório')) return 'fa-laptop';
    
    return 'fa-map-marker-alt';
}

// ========================================
// ENDEREÇOS - CRIAR/EDITAR
// ========================================

function abrirModalNovoEndereco() {
    enderecoEditando = null;
    document.getElementById('modalEnderecoTitulo').textContent = 'Novo Endereço';
    document.getElementById('formEndereco').reset();
    document.getElementById('enderecoId').value = '';
    document.getElementById('modalEndereco').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function editarEndereco(idendereco) {
    const endereco = enderecos.find(e => e.idendereco === idendereco);
    
    if (!endereco) return;
    
    enderecoEditando = endereco;
    
    // Preencher formulário
    document.getElementById('modalEnderecoTitulo').textContent = 'Editar Endereço';
    document.getElementById('enderecoId').value = endereco.idendereco;
    document.getElementById('enderecoApelido').value = endereco.apelido;
    document.getElementById('enderecoCep').value = endereco.cep;
    document.getElementById('enderecoLogradouro').value = endereco.logradouro;
    document.getElementById('enderecoNumero').value = endereco.numero;
    document.getElementById('enderecoComplemento').value = endereco.complemento || '';
    document.getElementById('enderecoBairro').value = endereco.bairro;
    document.getElementById('enderecoCidade').value = endereco.cidade;
    document.getElementById('enderecoEstado').value = endereco.estado;
    document.getElementById('enderecoReferencia').value = endereco.referencia || '';
    document.getElementById('enderecoPrincipal').checked = endereco.principal;
    
    document.getElementById('modalEndereco').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function fecharModalEndereco() {
    document.getElementById('modalEndereco').classList.remove('show');
    document.body.style.overflow = 'auto';
    document.getElementById('formEndereco').reset();
    enderecoEditando = null;
}

async function salvarEndereco(event) {
    event.preventDefault();
    
    const idendereco = document.getElementById('enderecoId').value;
    const dados = {
        apelido: document.getElementById('enderecoApelido').value.trim(),
        cep: document.getElementById('enderecoCep').value.replace(/\D/g, ''),
        logradouro: document.getElementById('enderecoLogradouro').value.trim(),
        numero: document.getElementById('enderecoNumero').value.trim(),
        complemento: document.getElementById('enderecoComplemento').value.trim(),
        bairro: document.getElementById('enderecoBairro').value.trim(),
        cidade: document.getElementById('enderecoCidade').value.trim(),
        estado: document.getElementById('enderecoEstado').value,
        referencia: document.getElementById('enderecoReferencia').value.trim(),
        principal: document.getElementById('enderecoPrincipal').checked ? 1 : 0
    };
    
    // Validação
    if (!dados.apelido || !dados.cep || !dados.logradouro || !dados.numero || 
        !dados.bairro || !dados.cidade || !dados.estado) {
        mostrarToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        const url = idendereco ? `/api/enderecos/${idendereco}` : '/api/enderecos';
        const method = idendereco ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            mostrarToast(
                idendereco ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!',
                'success'
            );
            
            fecharModalEndereco();
            carregarEnderecos();
        } else {
            const erro = await response.json();
            mostrarToast(erro.erro || 'Erro ao salvar endereço', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        mostrarToast('Erro ao salvar endereço', 'error');
    }
}

// ========================================
// ENDEREÇOS - AÇÕES
// ========================================

async function definirEnderecoPrincipal(idendereco) {
    if (!confirm('Deseja definir este endereço como principal?')) {
        return;
    }

    try {
        const response = await fetch(`/api/enderecos/${idendereco}/principal`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (response.ok) {
            mostrarToast('Endereço principal atualizado!', 'success');
            carregarEnderecos();
        } else {
            const erro = await response.json();
            mostrarToast(erro.erro || 'Erro ao atualizar endereço', 'error');
        }
    } catch (error) {
        console.error('Erro ao definir endereço principal:', error);
        mostrarToast('Erro ao atualizar endereço', 'error');
    }
}

async function excluirEndereco(idendereco) {
    if (!confirm('Deseja realmente excluir este endereço?')) {
        return;
    }

    try {
        const response = await fetch(`/api/enderecos/${idendereco}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            mostrarToast('Endereço excluído com sucesso!', 'success');
            carregarEnderecos();
        } else {
            const erro = await response.json();
            mostrarToast(erro.erro || 'Erro ao excluir endereço', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        mostrarToast('Erro ao excluir endereço', 'error');
    }
}

// ========================================
// BUSCAR CEP (ViaCEP)
// ========================================

async function buscarCEP() {
    const cep = document.getElementById('enderecoCep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        mostrarToast('CEP inválido', 'error');
        return;
    }
    
    const btn = document.getElementById('btnBuscarCep');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();
        
        if (dados.erro) {
            mostrarToast('CEP não encontrado', 'error');
            return;
        }
        
        // Preencher campos
        document.getElementById('enderecoLogradouro').value = dados.logradouro || '';
        document.getElementById('enderecoBairro').value = dados.bairro || '';
        document.getElementById('enderecoCidade').value = dados.localidade || '';
        document.getElementById('enderecoEstado').value = dados.uf || '';
        document.getElementById('enderecoComplemento').value = dados.complemento || '';
        
        // Focar no campo número
        document.getElementById('enderecoNumero').focus();
        
        mostrarToast('CEP encontrado!', 'success');
        
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        mostrarToast('Erro ao buscar CEP', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Buscar CEP';
    }
}

// ========================================
// TOAST (NOTIFICAÇÃO)
// ========================================

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Configurar mensagem
    toastMessage.textContent = mensagem;
    
    // Configurar tipo
    toast.classList.remove('error');
    if (tipo === 'error') {
        toast.classList.add('error');
    }
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// EXPORTAR FUNÇÕES GLOBAIS
// ========================================

window.abrirModalNovoEndereco = abrirModalNovoEndereco;
window.editarEndereco = editarEndereco;
window.excluirEndereco = excluirEndereco;
window.definirEnderecoPrincipal = definirEnderecoPrincipal;
window.getIconeEndereco = getIconeEndereco;

