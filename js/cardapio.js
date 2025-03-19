document.addEventListener('DOMContentLoaded', () => {
    const itemCardapio = document.querySelector('.item-cardapio');

    // Função para buscar os produtos do backend
    async function carregarProdutos() {
        try {
            const response = await fetch('http://localhost:3000/produtos'); // URL do backend
            if (!response.ok) throw new Error('Erro ao buscar produtos');
            
            const produtos = await response.json();
            exibirProdutos(produtos);
        } catch (error) {
            console.error(error);
            itemCardapio.innerHTML = '<p>Erro ao carregar o cardápio.</p>';
        }
    }

    // Função para exibir os produtos na página
    function exibirProdutos(produtos) {
        itemCardapio.innerHTML = ''; // Limpa antes de adicionar novos

        produtos.forEach(produto => {
            const produtoHTML = `
                <div class="produto">
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao}</p>
                    <p><strong>Categoria:</strong> ${produto.categoria}</p>
                    <p><strong>Preço:</strong> R$ ${produto.preco.toFixed(2)}</p>
                    <button class="adicionar-carrinho" data-id="${produto.idproduto}">Adicionar ao Carrinho</button>
                </div>
            `;
            itemCardapio.innerHTML += produtoHTML;
        });

        // Adicionar evento de clique para os botões de "Adicionar ao Carrinho"
        document.querySelectorAll('.adicionar-carrinho').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const idProduto = e.target.dataset.id;
                adicionarAoCarrinho(idProduto);
            });
        });
    }

    // Função para adicionar um produto ao carrinho (será implementada depois)
    function adicionarAoCarrinho(id) {
        alert(`Produto ${id} adicionado ao carrinho!`);
    }

    // Chama a função para carregar os produtos ao iniciar a página
    carregarProdutos();
});
