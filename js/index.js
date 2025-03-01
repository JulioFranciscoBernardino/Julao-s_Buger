// Seleção dos elementos
const botaoCarrinho = document.querySelector('.carrinho-botao');
const carrinhoLateral = document.querySelector('.carrinho-lateral');
const fecharCarrinho = document.querySelector('.fechar-carrinho');

// Abrir a barra lateral
botaoCarrinho.addEventListener('click', () => {
    carrinhoLateral.classList.add('ativo');
});

// Fechar a barra lateral
fecharCarrinho.addEventListener('click', () => {
    carrinhoLateral.classList.remove('ativo');
});
