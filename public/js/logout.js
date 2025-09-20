// Função para fazer logout
async function fazerLogout() {
    try {
        // Chamar a API de logout (opcional, mas mantém consistência)
        await fetch('/api/usuarios/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Remover token do localStorage (ambas as chaves possíveis)
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('token');
        
        // Limpar outros dados do usuário se houver
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_type');
        
        console.log('Logout realizado com sucesso!');
        
        // Redirecionar para página de login ou home
        window.location.href = '/login_cadastro';
        
    } catch (error) {
        console.error('Erro no logout:', error);
        
        // Mesmo se der erro na API, limpar o localStorage
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_type');
        
        // Redirecionar mesmo com erro
        window.location.href = '/login_cadastro';
    }
}

// Função para verificar se está logado
function verificarSeLogado() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    return !!token; // Retorna true se tem token, false se não tem
}

// Função para obter dados do usuário do localStorage
function obterDadosUsuario() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user_data');
    const userType = localStorage.getItem('user_type');
    
    return {
        token: token,
        userData: userData ? JSON.parse(userData) : null,
        userType: userType
    };
}

// Função para salvar dados do usuário após login
function salvarDadosUsuario(token, userData) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('user_type', userData.type || 'cliente');
}

// Tornar funções disponíveis globalmente
window.fazerLogout = fazerLogout;
window.verificarSeLogado = verificarSeLogado;
window.obterDadosUsuario = obterDadosUsuario;
window.salvarDadosUsuario = salvarDadosUsuario;

// Adicionar evento de logout para botões com classe 'logout-btn'
document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            fazerLogout();
        });
    });
});

console.log('Sistema de logout carregado!');
console.log('Use: fazerLogout() para fazer logout');
console.log('Use: verificarSeLogado() para verificar se está logado');
