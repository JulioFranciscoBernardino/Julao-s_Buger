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
            <button class="btn icone btn-editar-categoria" data-id="${categoria.idcategoria}"><i class="fas fa-edit"></i></button>
            <button class="btn icone"><i class="fas fa-eye"></i></button>
            <button class="btn icone btn-excluir-categoria" data-id="${categoria.idcategoria}"><i class="fas fa-trash-alt"></i></button>
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
      
      // Adicionar event listeners para os botões de categoria
      adicionarEventListenersCategoria();
    });
  });
});

// Função para adicionar event listeners aos botões de categoria
function adicionarEventListenersCategoria() {
  // Botões de excluir categoria
  document.querySelectorAll('.btn-excluir-categoria').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idCategoria = btn.getAttribute('data-id');
      excluirCategoria(idCategoria);
    });
  });

  // Botões de editar categoria
  document.querySelectorAll('.btn-editar-categoria').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idCategoria = btn.getAttribute('data-id');
      editarCategoria(idCategoria);
    });
  });
}

// Função para excluir categoria
async function excluirCategoria(idCategoria) {
  if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos desta categoria também serão excluídos.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/categorias/deletar/${idCategoria}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showSuccess('Categoria excluída com sucesso!');
      // Recarregar a página para atualizar a lista
      location.reload();
    } else {
      showError(result.error || 'Erro ao excluir categoria');
    }
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    showError('Erro ao excluir categoria. Tente novamente.');
  }
}

// Função para editar categoria
async function editarCategoria(idCategoria) {
  const novoNome = prompt('Digite o novo nome da categoria:');
  
  if (!novoNome || novoNome.trim() === '') {
    return;
  }
  
  try {
    const response = await fetch(`/api/categorias/atualizar/${idCategoria}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: novoNome.trim()
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showSuccess('Categoria atualizada com sucesso!');
      // Recarregar a página para atualizar a lista
      location.reload();
    } else {
      showError(result.error || 'Erro ao atualizar categoria');
    }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    showError('Erro ao atualizar categoria. Tente novamente.');
  }
}
