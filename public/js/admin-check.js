// Script para verificar se o usuário é admin e controlar visibilidade de elementos

console.log('🔐 Sistema de verificação de admin carregado');

// Função para verificar se o usuário é admin
function verificarSeAdmin() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    
    if (!token) {
        console.log('❌ Usuário não está logado');
        return false;
    }
    
    try {
        // Decodificar o token JWT (sem verificar assinatura)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('📋 Payload do token:', payload);
        
        // Verificar se o tipo é admin
        const isAdmin = payload.type === 'admin';
        console.log(`👤 Tipo de usuário: ${payload.type}`);
        console.log(`🔑 É admin: ${isAdmin}`);
        
        return isAdmin;
    } catch (error) {
        console.error('❌ Erro ao decodificar token:', error);
        return false;
    }
}

// Função para mostrar/ocultar elementos de admin
function controlarVisibilidadeAdmin() {
    const isAdmin = verificarSeAdmin();
    const isLoggedIn = !!localStorage.getItem('jwt_token') || !!localStorage.getItem('token');
    
    // Elementos que devem ser visíveis apenas para admin
    const elementosAdmin = document.querySelectorAll('.admin-only');
    
    elementosAdmin.forEach(elemento => {
        if (isAdmin) {
            elemento.style.display = 'block';
            elemento.classList.add('admin-visible');
        } else {
            elemento.style.display = 'none';
            elemento.classList.remove('admin-visible');
        }
    });
    
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        if (isLoggedIn) {
            logoutBtn.style.display = 'block';
        } else {
            logoutBtn.style.display = 'none';
        }
    }
    
    // Link de login - ocultar quando logado, mostrar quando não logado
    const loginLink = document.querySelector('a[href="/login_cadastro"]');
    if (loginLink) {
        const loginLi = loginLink.parentElement; // Pegar o <li> pai
        if (loginLi) {
            if (isLoggedIn) {
                loginLi.style.display = 'none';
            } else {
                loginLi.style.display = 'block';
            }
        }
    }
    
    console.log(`🔧 Visibilidade admin: ${isAdmin ? 'VISÍVEL' : 'OCULTO'}`);
    console.log(`🔧 Usuário logado: ${isLoggedIn ? 'SIM' : 'NÃO'}`);
}

// Função para adicionar classe admin-only a elementos específicos
function marcarElementosAdmin() {
    // Marcar link de administração
    const adminLink = document.querySelector('a[href="/admin_dashboard"]');
    if (adminLink) {
        const adminLi = adminLink.parentElement; // Pegar o <li> pai
        if (adminLi) {
            adminLi.classList.add('admin-only');
            adminLi.style.display = 'none'; // Ocultar por padrão
        }
    }
    
    // Marcar botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.style.display = 'none'; // Ocultar por padrão
    }
}

// Função para verificar e atualizar status do usuário
function atualizarStatusUsuario() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(`👤 Usuário logado: ${payload.email} (${payload.type})`);
        } catch (error) {
            console.error('❌ Erro ao processar token:', error);
        }
    }
}

// Função para fazer logout
function fazerLogout() {
    // Remover token do localStorage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
    
    console.log('🚪 Logout realizado');
    
    // Recarregar a página para atualizar a interface
    window.location.reload();
}

// Tornar funções disponíveis globalmente
window.verificarSeAdmin = verificarSeAdmin;
window.controlarVisibilidadeAdmin = controlarVisibilidadeAdmin;
window.fazerLogout = fazerLogout;

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando status de admin...');
    
    // Carregar CSS de controle de admin
    carregarCSSAdmin();
    
    // Marcar elementos que devem ser controlados
    marcarElementosAdmin();
    
    // Controlar visibilidade
    controlarVisibilidadeAdmin();
    
    // Atualizar status do usuário
    atualizarStatusUsuario();
    
    // Adicionar evento ao botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fazerLogout();
        });
    }
});

// Função para carregar CSS de controle de admin
function carregarCSSAdmin() {
    // Verificar se o CSS já foi carregado
    if (document.getElementById('admin-control-css')) {
        return;
    }
    
    const link = document.createElement('link');
    link.id = 'admin-control-css';
    link.rel = 'stylesheet';
    link.href = '/styles/admin-control.css';
    document.head.appendChild(link);
}

console.log('🔧 Comandos disponíveis:');
console.log('- verificarSeAdmin() - Verifica se usuário é admin');
console.log('- controlarVisibilidadeAdmin() - Controla visibilidade dos elementos');
console.log('- fazerLogout() - Faz logout do usuário');
