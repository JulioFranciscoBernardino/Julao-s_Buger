document.addEventListener('DOMContentLoaded', () => {
  // Modal de categoria
  const modal = document.getElementById('modalCategoria');
  const btnFechar = document.getElementById('FecharCategoria');
  const formCategoria = document.getElementById('formCategoria');
  const inputCategoria = document.getElementById('NovaCategoria');

  // Modal de produto
  const modalProduto = document.getElementById('modalProduto');
  const btnFecharProduto = document.getElementById('FecharProduto');
  const formProduto = document.getElementById('formProduto');
  const inputProdutoNome = document.getElementById('nomeProduto');
  const inputProdutoDescricao = document.getElementById('descricaoProduto');
  const inputProdutoPreco = document.getElementById('precoProduto');
  const inputProdutoCategoria = document.getElementById('produtoCategoria');
  const inputProdutoImagem = document.getElementById('produtoImagem');


  const btnAddProdutoEstatico = document.getElementById('btnAddProdutoEstatico');
  if (btnAddProdutoEstatico) {
    btnAddProdutoEstatico.addEventListener('click', () => {
      modalProduto.style.display = 'block';
    });
  }

  // Fechar modais
  btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  btnFecharProduto.addEventListener('click', () => {
    modalProduto.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = 'none';
    if (event.target === modalProduto) modalProduto.style.display = 'none';
  });

  // Cadastro de categoria
  formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = inputCategoria.value.trim();

    if (!nome) return alert('Informe o nome da categoria!');

    try {
      const response = await fetch('/api/categorias/inserir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Categoria cadastrada com sucesso!');
        modal.style.display = 'none';
        inputCategoria.value = '';
        location.reload();
      } else {
        alert(data.mensagem || 'Erro ao cadastrar.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cadastrar categoria.');
    }
  });

  // Cadastro de produto
  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nomeProduto = inputProdutoNome.value.trim();
    const descricaoProduto = inputProdutoDescricao.value.trim();
    const precoProduto = parseFloat(inputProdutoPreco.value.replace(',', '.'));
    const categoriaProduto = inputProdutoCategoria.value.trim();
    const imagemProduto = inputProdutoImagem.files[0];

    if (!nomeProduto) return alert('Informe o nome do produto!');
    if (!descricaoProduto) return alert('Informe a descrição do produto!');
    if (isNaN(precoProduto) || precoProduto <= 0) return alert('Informe um preço válido!');
    if (!categoriaProduto) return alert('Informe a categoria!');
    if (!imagemProduto) return alert('Selecione uma imagem!');

    const formData = new FormData();
    formData.append('nome', nomeProduto);
    formData.append('descricao', descricaoProduto);
    formData.append('preco', precoProduto);
    formData.append('categoria', categoriaProduto);
    formData.append('imagem', imagemProduto);

    try {
      const response = await fetch('/api/produtos/inserir', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Produto cadastrado com sucesso!');
        modalProduto.style.display = 'none';
        formProduto.reset();
        location.reload();
      } else {
        alert(data.mensagem || 'Erro ao cadastrar produto.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cadastrar produto.');
    }
  });


  // Deletar produto (soft delete)
  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('btn-excluir')) {
      const produtoBox = event.target.closest('.produto-box');
      const idProduto = produtoBox?.dataset.id;

      if (!idProduto) {
        alert('ID do produto não encontrado!');
        return;
      }

      if (!confirm('Tem certeza que deseja excluir este produto?')) return;

      try {
        const response = await fetch(`/api/produtos/deletar/${idProduto}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
          alert('Produto excluído com sucesso!');

        } else {
          alert(data.mensagem || 'Erro ao excluir produto.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir produto.');
      }
    }
  });



  // Carregar cardápio
  fetch('/api/cardapio/mostrarCardapio')
    .then(response => response.json())
    .then(data => {
      const categorias = data.categorias || [];
      const lista = document.getElementById('listaCategorias');
      const detalhes = document.getElementById('detalhesCategoria');

      lista.innerHTML = '';
      inputProdutoCategoria.innerHTML = '';

      
      const categoriasAtivas = categorias.filter(categoria => !categoria.excluido);

      categoriasAtivas.forEach((categoria, index) => {
        const div = document.createElement('div');
        div.className = 'grupo-item';
        div.dataset.index = index;
        div.innerHTML = `
        <span class="grupo-nome">${categoria.nome}</span><br>
        <span class="grupo-tag verde"><button>Ativo/Inativo</button></span><br>
      `;

        // <select> do formulário
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nome;
        inputProdutoCategoria.appendChild(option);

        // Evento ao clicar na categoria
        div.addEventListener('click', () => {
          detalhes.innerHTML = '';
          console.log('Categoria clicada:', categoria);

          const botoesDiv = document.createElement('div');
          botoesDiv.className = 'botoes-acoes';
          botoesDiv.innerHTML = `
          <button class="btn-adicionar" id="btnAddProduto">+ NOVO PRODUTO</button>
          <button class="btn-acao editar" title="Editar categoria"><i class="fas fa-pen"></i></button>
          <button class="btn-acao excluir" title="Excluir categoria"><i class="fas fa-trash"></i></button>
        `;
          detalhes.appendChild(botoesDiv);

          let produtosLista = document.getElementById('produtosLista');
          if (!produtosLista) {
            produtosLista = document.createElement('div');
            produtosLista.id = 'produtosLista';
            detalhes.appendChild(produtosLista);
          } else {
            produtosLista.innerHTML = '';
            detalhes.appendChild(produtosLista);
          }

          // Evento botão adicionar produto
          botoesDiv.querySelector('#btnAddProduto').addEventListener('click', () => {
            modalProduto.style.display = 'block';
          });

          // Filtra produtos que não estão excluídos
          const produtosAtivos = (categoria.produtos || []).filter(produto => !produto.excluido);

          if (produtosAtivos.length === 0) {
            produtosLista.innerHTML = '';
            const aviso = document.createElement('p');
            aviso.textContent = 'Nenhum produto ativo nesta categoria.';
            produtosLista.appendChild(aviso);
            return;
          }

          produtosLista.innerHTML = '';
          produtosAtivos.forEach(produto => {
            const prodDiv = document.createElement('div');
            prodDiv.className = 'produto-box';
            prodDiv.dataset.id = produto.id;

            let precoFormatado = '--';
            if (typeof produto.preco === 'number') {
              precoFormatado = produto.preco.toFixed(2);
            } else if (produto.preco && !isNaN(Number(produto.preco))) {
              precoFormatado = Number(produto.preco).toFixed(2);
            }

            let srcImg = produto.imagem || '';
            if (srcImg && !srcImg.startsWith('/imgs/')) {
              srcImg = '/imgs/' + srcImg;
            }

            prodDiv.innerHTML = `
            <div class="produto-handle" title="Arrastar para reordenar">
              <i class="fas fa-bars"></i>
            </div>

            <div class="produto-conteudo">
              <div class="produto-img">
                <img src="${srcImg}" alt="Imagem do produto">
              </div>

              <div class="produto-info">
                <h4>${produto.nome}</h4>
                <p>${produto.descricao}</p>
                <span class="produto-preco">R$ ${precoFormatado}</span>
              </div>
            </div>

            <div class="produto-botoes">
              <button title="Editar"><i class="fas fa-pen"></i></button>
              <button title="Opcionais"><i class="fas fa-martini-glass"></i></button>
              <button title="Excluir" id="btnDeletProduto" class="btn-excluir"><i class="fas fa-trash"></i></button>
            </div>
          `;

            produtosLista.appendChild(prodDiv);
          });

          // Ativa o Sortable
          Sortable.create(produtosLista, {
            handle: '.produto-handle',
            animation: 150,
            ghostClass: 'drag-ghost'
          });
        });

        lista.appendChild(div);
      });
    })
    .catch(err => {
      console.error('Erro ao carregar cardápio:', err);
    });


  // Botão dinâmico de nova categoria
  const btnNova = document.createElement('button');
  btnNova.className = 'btn-novo-grupo';
  btnNova.textContent = '+ NOVA CATEGORIA';
  btnNova.addEventListener('click', () => {
    modal.style.display = 'block';
  });
  lista.appendChild(btnNova);
})
  .catch(error => {
    console.error('Erro ao carregar o cardápio:', error);
  });

