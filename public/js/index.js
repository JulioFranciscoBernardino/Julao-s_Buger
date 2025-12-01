document.addEventListener('DOMContentLoaded', async function() {
    const openCartButton = document.getElementById('openCart');
    const closeCartButton = document.getElementById('closeCart');
    const cart = document.getElementById('cart');

    // Verificar status de funcionamento
    let statusFuncionamento = { aberto: true };
    try {
        const response = await fetch('/api/horarios-funcionamento/status');
        if (response.ok) {
            statusFuncionamento = await response.json();
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
    }

    // Função para abrir o carrinho
    openCartButton.addEventListener('click', async function() {
        // Verificar status atual antes de abrir o carrinho
        try {
            const response = await fetch('/api/horarios-funcionamento/status');
            if (response.ok) {
                statusFuncionamento = await response.json();
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
        
        // Verificar se está aberto antes de abrir o carrinho
        if (!statusFuncionamento.aberto) {
            showWarning(statusFuncionamento.mensagem || 'Estabelecimento fechado. Não é possível acessar o carrinho.');
            return;
        }
        cart.classList.add('open');
        openCartButton.classList.add('hidden');
        // Bloquear scroll do body quando carrinho estiver aberto (mobile)
        if (window.innerWidth <= 768) {
            // Salvar posição do scroll antes de bloquear
            const scrollY = window.scrollY;
            document.documentElement.classList.add('cart-open');
            document.body.classList.add('cart-open');
            document.body.style.top = `-${scrollY}px`;
        }
    });

    // Função para fechar o carrinho
    closeCartButton.addEventListener('click', function() {
        fecharCarrinho();
    });
    
    // Função para fechar carrinho (reutilizável)
    function fecharCarrinho() {
        cart.classList.remove('open');
        openCartButton.classList.remove('hidden');
        // Restaurar scroll do body quando carrinho fechar (mobile)
        if (window.innerWidth <= 768) {
            const scrollY = document.body.style.top;
            document.documentElement.classList.remove('cart-open');
            document.body.classList.remove('cart-open');
            document.body.style.top = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    }
    
    // Fechar carrinho ao clicar fora dele (no overlay)
    cart.addEventListener('click', function(e) {
        // Se clicar no próprio carrinho (não no conteúdo), fechar
        if (e.target === cart) {
            fecharCarrinho();
        }
    });
    
    // Fechar carrinho ao pressionar ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cart.classList.contains('open')) {
            fecharCarrinho();
        }
    });
    
    // Atualizar status periodicamente
    setInterval(async () => {
        try {
            const response = await fetch('/api/horarios-funcionamento/status');
            if (response.ok) {
                statusFuncionamento = await response.json();
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    }, 60000); // A cada minuto

});

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
