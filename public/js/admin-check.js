// Verificar se é página do retaguarda
function isRetaguardaPage() {
    const retaguardaPages = [
        '/admin_dashboard',
        '/cardapio',
        '/pedidos',
        '/horarios-funcionamento',
        '/taxas-entrega'
    ];
    const currentPath = window.location.pathname;
    return retaguardaPages.some(page => currentPath.includes(page));
}

// Verificar e preservar token no início (antes de qualquer outra coisa)
(function preservarToken() {
    try {
        // Sincronizar chaves de token
        const jwtToken = localStorage.getItem('jwt_token');
        const token = localStorage.getItem('token');
        
        // Se uma chave existe mas a outra não, copiar
        if (jwtToken && !token) {
            localStorage.setItem('token', jwtToken);
        } else if (token && !jwtToken) {
            localStorage.setItem('jwt_token', token);
        }
    } catch (error) {
        console.error('Erro ao preservar token:', error);
    }
})();

// Função auxiliar para obter token de forma robusta
function obterToken() {
    try {
        let token = localStorage.getItem('jwt_token');
        if (!token) {
            token = localStorage.getItem('token');
        }
        return token;
    } catch (error) {
        console.error('Erro ao acessar localStorage:', error);
        return null;
    }
}

// Verificar se usuário é admin via token
function verificarSeAdmin() {
    const token = obterToken();
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.exp) {
            const agora = Date.now() / 1000;
            if (payload.exp < agora) {
                return false;
            }
        }
        
        return payload.type === 'admin' || payload.type === 'adm';
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return false;
    }
}

// Verificar autenticação e permissão de admin via API
async function verificarAutenticacaoAdmin() {
    const token = obterToken();
    
    if (!token) {
        return { autenticado: false, admin: false, erro: 'sem_token' };
    }
    
    try {
        const response = await fetch('/api/usuarios/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const usuario = await response.json();
            const isAdmin = usuario.tipo === 'admin' || usuario.tipo === 'adm';
            return { autenticado: true, admin: isAdmin, usuario };
        } else if (response.status === 401 || response.status === 403) {
            return { autenticado: false, admin: false, erro: 'token_invalido' };
        } else {
            return { autenticado: null, admin: null, erro: 'erro_servidor' };
        }
    } catch (error) {
        return { autenticado: null, admin: null, erro: 'erro_rede' };
    }
}

// Proteger páginas do retaguarda
async function protegerRetaguarda() {
    if (!isRetaguardaPage()) {
        return; // Não é página do retaguarda, não precisa proteger
    }
    
    let token = obterToken();
    
    // Se não encontrou, tentar novamente após um pequeno delay
    if (!token) {
        await new Promise(resolve => setTimeout(resolve, 50));
        token = obterToken();
    }
    
    // Se ainda não encontrou, tentar mais uma vez
    if (!token) {
        await new Promise(resolve => setTimeout(resolve, 50));
        token = obterToken();
    }
    
    const jwtToken = localStorage.getItem('jwt_token');
    const tokenNormal = localStorage.getItem('token');
    
    // Se não tiver token, redirecionar imediatamente
    if (!token) {
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login_cadastro?redirect=${currentUrl}&error=token_necessario`;
        return;
    }
    
    // Verificação rápida via token local
    const isAdminLocal = verificarSeAdmin();
    
    if (!isAdminLocal) {
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login_cadastro?redirect=${currentUrl}&error=acesso_negado`;
        return;
    }
    
    const verificacao = await verificarAutenticacaoAdminCached();
    
    // Se a verificação retornou null (erro de rede/servidor), confiar na verificação local
    if (verificacao.autenticado === null || verificacao.admin === null) {
        // Erro temporário: confiar na verificação local
    } else if (!verificacao.autenticado || !verificacao.admin) {
        // Só limpar token se a verificação da API confirmar que é inválido
        // E se a verificação local também falhar (dupla verificação)
        const isAdminLocalNovamente = verificarSeAdmin();
        
        if (!isAdminLocalNovamente || verificacao.erro === 'token_invalido') {
            // Limpar tokens inválidos apenas se ambas verificações falharem
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_type');
            
            // Redirecionar para login
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login_cadastro?redirect=${currentUrl}&error=acesso_negado`;
            return;
        }
        // Se a verificação local ainda passar, permitir acesso mesmo com erro na API
    }
    
    // Usuário autenticado e admin: acesso liberado
}

// Atualizar links do retaguarda para sempre levar o token na URL (para o middleware do backend)
function atualizarLinksRetaguardaComToken() {
    const token = obterToken();
    if (!token) return;

    const adminPaths = ['/admin_dashboard', '/cardapio', '/pedidos', '/horarios-funcionamento', '/taxas-entrega'];

    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        try {
            const url = new URL(link.href, window.location.origin);

            if (adminPaths.some(p => url.pathname === p)) {
                // Preservar outros parâmetros da URL, só garantir que tem ?token=...
                url.searchParams.set('token', token);
                link.href = url.toString();
            }
        } catch (e) {
            // Ignorar links inválidos
        }
    });
}

// Função para mostrar/ocultar elementos de admin
function controlarVisibilidadeAdmin() {
    const isAdmin = verificarSeAdmin();
    const isLoggedIn = !!obterToken();
    
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

    // Se estiver logado como admin, garantir que todos os links do retaguarda carreguem com token,
    // mesmo em páginas públicas que tenham links para o painel (sobre_nos, etc.)
    if (isAdmin) {
        atualizarLinksRetaguardaComToken();
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

// Cache para verificação de admin (evita múltiplas chamadas à API)
let adminVerificationCache = {
    timestamp: 0,
    result: null,
    TTL: 30000 // 30 segundos
};

// Verificação otimizada com cache
async function verificarAutenticacaoAdminCached() {
    const now = Date.now();
    
    // Se o cache ainda é válido, retornar resultado em cache
        if (adminVerificationCache.result && (now - adminVerificationCache.timestamp) < adminVerificationCache.TTL) {
            if (adminVerificationCache.result.autenticado !== null && adminVerificationCache.result.admin !== null) {
                return adminVerificationCache.result;
            }
        }
    
    // Fazer nova verificação
    const resultado = await verificarAutenticacaoAdmin();
    
    // Atualizar cache apenas se o resultado for válido ou erro definitivo
    if (resultado.autenticado !== null || resultado.erro === 'token_invalido') {
        adminVerificationCache = {
            timestamp: now,
            result: resultado
        };
    } else if (adminVerificationCache.result && adminVerificationCache.result.autenticado !== null) {
        // Se houver erro de rede mas o cache anterior tinha resultado válido, manter o cache válido
        // Mas estender o TTL apenas um pouco (5 segundos) para tentar novamente em breve
        adminVerificationCache.TTL = 5000;
    }
    
    return resultado;
}

// Executar verificação ANTES do DOM carregar completamente (para páginas do retaguarda)
let verificacaoEmAndamento = false;
let verificacaoConcluida = false;

async function iniciarProtecaoRetaguarda() {
    if (!isRetaguardaPage() || verificacaoEmAndamento) {
        return;
    }
    
    verificacaoEmAndamento = true;
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    let token = obterToken();
    let tentativas = 0;
    const maxTentativas = 5;
    
    while (!token && tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 20));
        token = obterToken();
        tentativas++;
    }
    
    if (!token) {
        verificacaoEmAndamento = false;
        return;
    }
    
    await protegerRetaguarda();
    verificacaoConcluida = true;
    verificacaoEmAndamento = false;
}

// Iniciar verificação imediatamente para páginas do retaguarda
if (isRetaguardaPage()) {
    // Usar requestIdleCallback se disponível, senão usar setTimeout
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            iniciarProtecaoRetaguarda();
        }, { timeout: 100 });
    } else {
        // Fallback para navegadores que não suportam requestIdleCallback
        setTimeout(() => {
            iniciarProtecaoRetaguarda();
        }, 0);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Se for página do retaguarda, já foi verificado acima
    if (isRetaguardaPage()) {
        // Aguardar até que a verificação termine ou timeout
        const aguardarVerificacao = () => {
            if (verificacaoConcluida || !verificacaoEmAndamento) {
                carregarCSSAdmin();
                marcarElementosAdmin();
                controlarVisibilidadeAdmin();
                atualizarStatusUsuario();
            } else {
                // Se ainda estiver verificando, aguardar mais um pouco
                setTimeout(aguardarVerificacao, 50);
            }
        };
        
        // Aguardar um pouco antes de começar a verificar
        setTimeout(aguardarVerificacao, 50);
    } else {
        // Para outras páginas, carregar normalmente
        carregarCSSAdmin();
        marcarElementosAdmin();
        controlarVisibilidadeAdmin();
        atualizarStatusUsuario();
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fazerLogout();
            // Limpar cache ao fazer logout
            adminVerificationCache = { timestamp: 0, result: null, TTL: 30000 };
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

