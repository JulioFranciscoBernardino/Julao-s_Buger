document.addEventListener('DOMContentLoaded', () => {
  const categoriasData = window.categoriasData;
  const categoriaItems = document.querySelectorAll('.grupo-item');
  const detalhesContainer = document.querySelector('.grupo-detalhes');

  categoriaItems.forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-index'));

      // Troca a classe ativa
      categoriaItems.forEach(i => i.classList.remove('ativo'));
      item.classList.add('ativo');

      const categoria = categoriasData[index];

      let html = `
        <div class="grupo-topo">
          <h3>${categoria.nome}</h3>
          <div class="grupo-topo-tags">
            <span class="grupo-itens">${categoria.produtos.length} item(s)</span>
          </div>
          <div class="grupo-acoes">
            <button class="btn">+ Novo produto</button>
            <button class="btn icone"><i class="fas fa-edit"></i></button>
            <button class="btn icone"><i class="fas fa-eye"></i></button>
            <button class="btn icone btn-excluir"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      `;

      categoria.produtos.forEach(produto => {
        html += `
          <div class="produto-item">
            <div class="produto-imagem"><i class="fas fa-image"></i></div>
            <div class="produto-info">
              <h4>${produto.nome}</h4>
              <p>${produto.descricao}</p>
              <div class="produto-preco">R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="produto-acoes">
              <div class="produto-botoes">
                <button><i class="fas fa-edit"></i></button>
                <button><i class="fas fa-eye"></i></button>
                <button class="btn-excluir"><i class="fas fa-trash-alt"></i></button>
              </div>
            </div>
          </div>
        `;
      });

      detalhesContainer.innerHTML = html;
    });
  });
});
