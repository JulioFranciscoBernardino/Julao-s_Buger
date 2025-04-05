document.addEventListener('DOMContentLoaded', function() {
    const openCartButton = document.getElementById('openCart');
    const closeCartButton = document.getElementById('closeCart');
    const cart = document.getElementById('cart');

    // Função para abrir o carrinho
    openCartButton.addEventListener('click', function() {
        cart.classList.add('open');
        openCartButton.classList.add('hidden');
    });

    // Função para fechar o carrinho
    closeCartButton.addEventListener('click', function() {
        cart.classList.remove('open');
        openCartButton.classList.remove('hidden');
    });
});
