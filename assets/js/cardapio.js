document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await fetch("http://localhost:3000/api/produtos");
        const produtos = await response.json();
        const container = document.getElementById("cardapio");

        produtos.forEach(produto => {
            const item = document.createElement("div");
            item.classList.add("produto");
            item.innerHTML = `
                <h2>${produto.nome}</h2>
                <p>${produto.descricao}</p>
                <span>R$ ${produto.preco.toFixed(2)}</span>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
});
