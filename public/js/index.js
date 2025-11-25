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
            alert(statusFuncionamento.mensagem || 'Estabelecimento fechado. Não é possível acessar o carrinho.');
            return;
        }
        cart.classList.add('open');
        openCartButton.classList.add('hidden');
    });

    // Função para fechar o carrinho
    closeCartButton.addEventListener('click', function() {
        cart.classList.remove('open');
        openCartButton.classList.remove('hidden');
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
