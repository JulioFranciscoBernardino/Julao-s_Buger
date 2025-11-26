function verificarSeAdmin() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.type === 'admin';
    } catch {
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

function atualizarStatusUsuario() {
    // Função mantida para compatibilidade, mas sem logs
}

// Função para fazer logout
function fazerLogout() {
    // Remover token do localStorage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
    window.location.reload();
}

// Tornar funções disponíveis globalmente
window.verificarSeAdmin = verificarSeAdmin;
window.controlarVisibilidadeAdmin = controlarVisibilidadeAdmin;
window.fazerLogout = fazerLogout;

document.addEventListener('DOMContentLoaded', function() {
    carregarCSSAdmin();
    marcarElementosAdmin();
    controlarVisibilidadeAdmin();
    atualizarStatusUsuario();
    
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

