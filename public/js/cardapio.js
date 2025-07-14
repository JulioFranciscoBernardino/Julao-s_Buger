document.addEventListener('DOMContentLoaded', () => {
  // Modal para cadastro de categoria
  const modal = document.getElementById('modalCategoria');
  const btnFechar = document.getElementById('Fechar');
  const formCategoria = document.getElementById('formCategoria');
  const inputCategoria = document.getElementById('NovaCategoria');

  // Modal para cadastro de produto
  const modalProduto = document.getElementById('modalProduto');
  const btnFecharProduto = document.getElementById('FecharProduto');
  const formProduto = document.getElementById('formProduto');

  const inputProdutoNome = document.getElementById('produtoNome');
  const inputProdutoDescricao = document.getElementById('produtoDescricao');
  const inputProdutoPreco = document.getElementById('produtoPreco');
  const inputProdutoCategoria = document.getElementById('produtoCategoria');
  const inputProdutoImagem = document.getElementById('produtoImagem');
  
  const botoesDiv = document.querySelector('.botoes-acoes');


  btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });


  //cadastro de categoria
  formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = inputCategoria.value.trim();
    if (!nome) {
      alert('Informe o nome da categoria!');
      return;
    }

    try {
      const response = await fetch('/api/categorias/inserir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome })
      });

      const data = await response.json();
      console.log('Resposta do cadastro:', data);
          // Adiciona evento para abrir o modal de produto
          const btnAddProduto = botoesDiv.querySelector('#btnAddProduto');
          btnAddProduto.addEventListener('click', () => {
            modalProduto.style.display = 'block';
          });

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

  //Cadastro de produto
  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nomeProduto = inputProdutoNome.value.trim();
    if (!nomeProduto) {
      alert('Informe o nome do produto!');
      return;
    }

    const descricaoProduto = inputProdutoDescricao.value.trim();
    if (!descricaoProduto) {
      alert('Informe a descrição do produto!');
      return;
    }

    const precoProduto = parseFloat(inputProdutoPreco.value);
    if (isNaN(precoProduto) || precoProduto <= 0) {
      alert('Informe um preço válido para o produto!');
      return;
    }

    const categoriaProduto = inputProdutoCategoria.value.trim();
    if (!categoriaProduto) {
      alert('Informe a categoria do produto!');
      return;
    }

    const imagemProduto = inputProdutoImagem.files[0];
    if (!imagemProduto) {
      alert('Selecione uma imagem para o produto!');
      return;
    }

    const formData = new FormData();
    formData.append('nome', nomeProduto);
    formData.append('descricao', descricaoProduto);
    formData.append('preco', precoProduto);
    formData.append('categoria', categoriaProduto);
    formData.append('imagem', imagemProduto);
    formData.append('imagem', categoriaProduto);

    try {
      const response = await fetch('/api/produtos/inserir', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('Resposta do cadastro:', data);

      if (response.ok) {
        alert('Produto cadastrado com sucesso!');
        modalProduto.style.display = 'none';
        inputProdutoNome.value = '';
        inputProdutoDescricao.value = '';
        inputProdutoPreco.value = '';
        inputProdutoCategoria.value = '';
        inputProdutoImagem.value = '';
        location.reload();
      } else {
        alert(data.mensagem || 'Erro ao cadastrar produto.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cadastrar produto.');
    }

  });


  // Carregar dados do cardápio dinamicamente
  fetch('/api/cardapio/mostrarCardapio')
    .then(response => response.json())
    .then(data => {
      const categorias = data.categorias;
      const lista = document.getElementById('listaCategorias');
      const detalhes = document.getElementById('detalhesCategoria');

      lista.innerHTML = '';
      categorias.forEach((categoria, index) => {
        const div = document.createElement('div');
        div.className = 'grupo-item';
        div.dataset.index = index;
        div.innerHTML = `
          <span class="grupo-nome">${categoria.nome}</span><br>
          <span class="grupo-tag verde"><button>Ativo/Inativo</button></span><br>
        `;

        div.addEventListener('click', () => {
          detalhes.innerHTML = '';

          // Botões de ação ao selecionar categoria
          const botoesDiv = document.createElement('div');
          botoesDiv.className = 'botoes-acoes';
          botoesDiv.innerHTML = `
            <button id="btnAddProduto" class="btn-adicionar">+ NOVO PRODUTO</button>
            <button class="btn-acao editar" title="Editar categoria"><i class="fas fa-pen"></i></button>
            <button class="btn-acao excluir" title="Excluir categoria"><i class="fas fa-trash"></i></button>
          `;
          detalhes.appendChild(botoesDiv);

          // Produtos da categoria
          if (categoria.produtos.length === 0) {
            const aviso = document.createElement('p');
            aviso.textContent = 'Nenhum produto nesta categoria.';
            detalhes.appendChild(aviso);
            return;
          }

          categoria.produtos.forEach(produto => {
            const prodDiv = document.createElement('div');
            prodDiv.className = 'produto-item';
            prodDiv.innerHTML = `
              <h3>${produto.nome}</h3>
              <p>${produto.descricao}</p>
              <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
            `;
            detalhes.appendChild(prodDiv);
          });
        });

        lista.appendChild(div);
      });

      // Botão dinâmico de nova categoria
      const btnNova = document.createElement('button');
      btnNova.className = 'btn-novo-grupo';
      btnNova.textContent = '+ NOVA CATEGORIA';
      lista.appendChild(btnNova);
      btnNova.addEventListener('click', () => {
        modal.style.display = 'block';
      });
    })
    .catch(error => {
      console.error('Erro ao carregar o cardápio:', error);
    });
});
