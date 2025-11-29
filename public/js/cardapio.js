// Variáveis globais
let lista = null;
let modal = null;
let ordenacaoAlterada = false; // Rastreia se a ordenação foi alterada
let sortableInstance = null; // Instância do Sortable para produtos
let sortableCategoriasInstance = null; // Instância do Sortable para categorias
let ordenacaoCategoriasAlterada = false; // Rastreia se a ordenação de categorias foi alterada

// Funções de loading
function showLoading(message = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = overlay.querySelector('.loading-text');
  text.textContent = message;
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'none';
}

// Funções para gerenciar imagens no formulário de produto
function handleImageChange() {
  const fileInput = document.getElementById('produtoImagem');
  const file = fileInput.files[0];
  const previewContainer = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  if (file) {
    // Mostrar preview da imagem selecionada
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    previewContainer.style.display = 'none';
  }
}

function showExistingImage(imageUrl) {
  const previewContainer = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  // Garantir que a URL está correta
  if (imageUrl && !imageUrl.startsWith('/imgs/') && !imageUrl.startsWith('http')) {
    imageUrl = `/imgs/${imageUrl}`;
  }
  
  previewImg.src = imageUrl;
  previewImg.onerror = function() {
    console.error('Erro ao carregar imagem:', imageUrl);
    previewContainer.style.display = 'none';
  };
  previewImg.onload = function() {
    previewContainer.style.display = 'block';
  };
}
let modalProduto = null;
let modalOpcional = null;


// Aguardar o DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
  
  // Elementos do DOM
  lista = document.getElementById('listaCategorias');
  modal = document.getElementById('modalCategoria');
  modalProduto = document.getElementById('modalProduto');
  modalOpcional = document.getElementById('modalOpcional');

  const btnFechar = document.getElementById('FecharCategoria');
  const btnFecharProduto = document.getElementById('FecharProduto');
  const btnFecharOpcional = document.getElementById('fecharOpcional');
  const formOpcional = document.getElementById('formOpcional');
  const inputOpcionalNome = document.getElementById('nomeOpcional');
  const inputOpcionalTipo = document.getElementById('tipoOpcional');
  const inputOpcionalPreco = document.getElementById('precoOpcional');

  const btnAddProdutoEstatico = document.getElementById('btnAddProdutoEstatico');
  const btnAddOpcional = document.getElementById('btnAddOpcional');
  const btnAddGrupo = document.getElementById('btnAddGrupo');
  const btnSalvarOrdenacao = document.getElementById('btnSalvarOrdenacao');
  const btnSalvarOrdenacaoCategorias = document.getElementById('btnSalvarOrdenacaoCategorias');
  
  // Botões de ação na área principal
  const btnEditarCategoria = document.querySelector('.btn-acao.editar');
  const btnExcluirCategoria = document.getElementById('btnDeletProduto');
  
  // Elementos do modal de grupo de opcionais
  const modalGrupoOpcional = document.getElementById('modalGrupoOpcional');
  const btnFecharGrupoOpcional = document.getElementById('fecharGrupoOpcional');
  const formGrupoOpcional = document.getElementById('formGrupoOpcional');
  
  // Elementos do modal de categoria
  const modalCategoria = modal; // Já definido acima
  const formCategoria = document.getElementById('formCategoria');
  
  
  if (btnAddProdutoEstatico) {
    btnAddProdutoEstatico.addEventListener('click', async () => {
      // Limpar formulário
      document.getElementById('nomeProduto').value = '';
      document.getElementById('descricaoProduto').value = '';
      document.getElementById('precoProduto').value = '';
      document.getElementById('produtoCategoria').value = '';
      
      // Carregar categorias no select
      await carregarCategoriasSelect();
      
      // Alterar título do modal
      document.querySelector('#modalProduto h2').textContent = 'Novo Produto';
      
      // Alterar comportamento do formulário
      const formProduto = document.getElementById('formProduto');
      formProduto.dataset.modo = 'inserir';
      delete formProduto.dataset.idProduto;
      
      // Limpar campos e esconder preview de imagem
      document.getElementById('nomeProduto').value = '';
      document.getElementById('descricaoProduto').value = '';
      document.getElementById('precoProduto').value = '';
      document.getElementById('produtoCategoria').value = '';
      document.getElementById('produtoImagem').value = '';
      document.getElementById('imagePreview').style.display = 'none';
      
      // Mostrar modal
      modalProduto.style.display = 'block';
    });
  }

  // Fechar modais
  if (btnFechar) {
  btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  }

  if (btnFecharProduto) {
  btnFecharProduto.addEventListener('click', () => {
    modalProduto.style.display = 'none';
  });
  }

  if (btnFecharOpcional) {
    btnFecharOpcional.addEventListener('click', () => {
      modalOpcional.style.display = 'none';
    });
  }

  if (btnFecharGrupoOpcional) {
    btnFecharGrupoOpcional.addEventListener('click', () => {
      modalGrupoOpcional.style.display = 'none';
    });
    }

  // Formulário de categoria
  if (formCategoria) {
    formCategoria.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nomeCategoria = document.getElementById('NovaCategoria').value.trim();
      
      if (!nomeCategoria) {
        alert('Por favor, preencha o nome da categoria!');
        return;
      }
      
      const modo = formCategoria.dataset.modo;
      const idCategoria = formCategoria.dataset.idCategoria;
      
      try {
        showLoading(modo === 'editar' ? 'Atualizando categoria...' : 'Criando categoria...');
        
        let url, method;
        
        if (modo === 'editar') {
          url = `/api/categorias/atualizar/${idCategoria}`;
          method = 'PUT';
        } else {
          url = '/api/categorias/inserir';
          method = 'POST';
        }
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: nomeCategoria
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          hideLoading();
          alert(modo === 'editar' ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!');
          modalCategoria.style.display = 'none';
          // Recarregar a página para atualizar a lista
          location.reload();
        } else {
          hideLoading();
          alert('Erro: ' + result.error);
        }
      } catch (error) {
        hideLoading();
        alert('Erro ao salvar categoria!');
      }
    });
  }

  // Menu mobile toggle
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarCenter = document.querySelector('.navbar-center');
  
  if (navbarToggle && navbarCenter) {
    navbarToggle.addEventListener('click', () => {
      navbarToggle.classList.toggle('active');
      navbarCenter.classList.toggle('active');
    });
  }

  // Botões de ação na área principal
  if (btnEditarCategoria) {
    btnEditarCategoria.addEventListener('click', () => {
      const categoriaAtiva = document.querySelector('.grupo-item.ativo');
      if (categoriaAtiva) {
        const idCategoria = categoriaAtiva.dataset.id;
        editarCategoria(idCategoria);
      } else {
        alert('Selecione uma categoria para editar!');
      }
    });
  }
  
  if (btnExcluirCategoria) {
    btnExcluirCategoria.addEventListener('click', () => {
      const categoriaAtiva = document.querySelector('.grupo-item.ativo');
      if (categoriaAtiva) {
        const idCategoria = categoriaAtiva.dataset.id;
        excluirCategoria(idCategoria);
      } else {
        alert('Selecione uma categoria para excluir!');
      }
    });
  }

  // Botão para adicionar opcional (removido - agora opcionais são criados apenas dentro dos grupos)

  // Botão para adicionar grupo de opcionais
  if (btnAddGrupo) {
    btnAddGrupo.addEventListener('click', () => {
      // Limpar formulário
      document.getElementById('nomeGrupoOpcional').value = '';
      document.getElementById('descricaoGrupoOpcional').value = '';
      document.getElementById('posicaoGrupoOpcional').value = '0';
      
      // Alterar título do modal
      document.querySelector('#modalGrupoOpcional h2').textContent = 'Novo Grupo de Opcionais';
      
      // Alterar comportamento do formulário
      formGrupoOpcional.dataset.modo = 'inserir';
      delete formGrupoOpcional.dataset.idGrupo;
      
      // Mostrar modal
      modalGrupoOpcional.style.display = 'block';
    });
  }

  // Botão de salvar ordenação
  if (btnSalvarOrdenacao) {
    btnSalvarOrdenacao.addEventListener('click', () => {
      salvarOrdenacao();
    });
  }

  // Botão de salvar ordenação de categorias
  if (btnSalvarOrdenacaoCategorias) {
    btnSalvarOrdenacaoCategorias.addEventListener('click', () => {
      salvarOrdenacaoCategorias();
    });
  }

  // Formulário de grupo de opcionais
  if (formGrupoOpcional) {
    formGrupoOpcional.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nomeGrupo = document.getElementById('nomeGrupoOpcional').value.trim();
      const descricaoGrupo = document.getElementById('descricaoGrupoOpcional').value.trim();
      const posicaoGrupo = parseInt(document.getElementById('posicaoGrupoOpcional').value) || 0;
      
      if (!nomeGrupo) {
        alert('Por favor, preencha o nome do grupo!');
        return;
      }

      const modo = formGrupoOpcional.dataset.modo;
      const idGrupo = formGrupoOpcional.dataset.idGrupo;
      
      try {
        let url, method, body;
        
        if (modo === 'editar') {
          url = `/api/grupos-opcionais/atualizar/${idGrupo}`;
          method = 'PUT';
        } else {
          url = '/api/grupos-opcionais';
          method = 'POST';
        }
        
        body = JSON.stringify({
          nome: nomeGrupo,
          descricao: descricaoGrupo,
          posicao: posicaoGrupo
        });
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: body
        });
        
        const result = await response.json();
        
        if (response.ok) {
          alert(modo === 'editar' ? 'Grupo atualizado com sucesso!' : 'Grupo cadastrado com sucesso!');
          modalGrupoOpcional.style.display = 'none';
          carregarGruposOpcionais(); // Recarregar lista
        } else {
          alert('Erro: ' + result.error);
        }
      } catch (error) {
        console.error('Erro ao salvar grupo:', error);
        alert('Erro ao salvar grupo!');
      }
    });
  }

  // Event listener para o formulário de produto
  const formProduto = document.getElementById('formProduto');
  if (formProduto) {
  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();

      const nome = document.getElementById('nomeProduto').value.trim();
      const descricao = document.getElementById('descricaoProduto').value.trim();
      const preco = document.getElementById('precoProduto').value;
      const categoria = document.getElementById('produtoCategoria').value;
      
      if (!nome || !descricao || !preco || !categoria) {
        alert('Por favor, preencha todos os campos!');
        return;
      }
      
      const modo = formProduto.dataset.modo;
      const idProduto = formProduto.dataset.idProduto;
      
      try {
        showLoading(modo === 'editar' ? 'Atualizando produto...' : 'Criando produto...');
        
        let url, method, body;
        
        // Verificar se há imagem para upload
        const fileInput = document.getElementById('produtoImagem');
        const temImagem = fileInput.files.length > 0;
        
        if (modo === 'editar') {
          url = `/api/produtos/atualizar/${idProduto}`;
          method = 'PUT';
        } else {
          url = '/api/produtos/inserir';
          method = 'POST';
        }
        
        // Se há imagem, usar FormData, senão usar JSON
        let response;
        if (temImagem) {
          const file = fileInput.files[0];
          console.log('📤 Enviando arquivo:', {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          body = new FormData();
          body.append('nome', nome);
          body.append('descricao', descricao);
          body.append('preco', parseFloat(preco));
          body.append('categoria', parseInt(categoria));
          body.append('imagem', file);
          
          console.log('📋 FormData criado, enviando para:', url);
          
          response = await fetch(url, {
            method: method,
            body: body
            // Não definir Content-Type manualmente - o browser define automaticamente com boundary
          });
        } else {
          body = JSON.stringify({
            nome: nome,
            descricao: descricao,
            preco: parseFloat(preco),
            categoria: parseInt(categoria)
          });
          
          response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: body
          });
        }
        
        const result = await response.json();

      if (response.ok) {
          hideLoading();
          alert(modo === 'editar' ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        modalProduto.style.display = 'none';
          location.reload(); // Recarregar página
      } else {
          hideLoading();
          alert('Erro: ' + result.error);
      }
    } catch (error) {
        hideLoading();
        alert('Erro ao salvar produto!');
      }
    });
  }

  // Formulário de opcional
  if (formOpcional) {
    formOpcional.addEventListener('submit', async (e) => {
    e.preventDefault();

      const nomeOpcional = inputOpcionalNome.value.trim();
      const tipoOpcional = inputOpcionalTipo.value;
      const precoOpcional = parseFloat(inputOpcionalPreco.value);
      
      const modo = formOpcional.dataset.modo;
      const idOpcional = formOpcional.dataset.idOpcional;
      
      // Obter o ID do grupo - se estiver editando, usar o ID armazenado
      let grupoOpcional;
      if (modo === 'editar') {
        grupoOpcional = formOpcional.dataset.idGrupo;
      } else {
        grupoOpcional = document.getElementById('grupoOpcional').value;
      }
      
      if (!nomeOpcional || !tipoOpcional || isNaN(precoOpcional) || !grupoOpcional) {
        alert('Por favor, preencha todos os campos corretamente!');
        return;
      }
      
      try {
        let url, method, body;
        
        if (modo === 'editar') {
          url = `/api/opcionais/atualizar/${idOpcional}`;
          method = 'PUT';
        } else {
          url = '/api/opcionais/inserir';
          method = 'POST';
        }
        
        body = JSON.stringify({
          nome: nomeOpcional,
          tipo: tipoOpcional,
          preco: precoOpcional,
          idgrupo_opcional: grupoOpcional
        });
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: body
        });
        
        const result = await response.json();

        if (response.ok) {
          alert(modo === 'editar' ? 'Opcional atualizado com sucesso!' : 'Opcional cadastrado com sucesso!');
          modalOpcional.style.display = 'none';
          carregarOpcionais(); // Recarregar lista
        } else {
          alert('Erro: ' + result.error);
        }
      } catch (error) {
        console.error('Erro ao salvar opcional:', error);
        alert('Erro ao salvar opcional!');
      }
    });
    }

  // Botão dinâmico de nova categoria (sempre visível)
  const btnNova = document.createElement('button');
  btnNova.className = 'btn-novo-grupo';
  btnNova.textContent = '+ NOVA CATEGORIA';
  btnNova.addEventListener('click', () => {
    // Limpar formulário
    document.getElementById('NovaCategoria').value = '';
    
    // Alterar título do modal
    document.querySelector('#modalCategoria h2').textContent = 'Nova Categoria';
    
    // Alterar comportamento do formulário
    if (formCategoria) {
      formCategoria.dataset.modo = 'inserir';
      delete formCategoria.dataset.idCategoria;
    }
    
    // Mostrar modal
    modal.style.display = 'block';
  });
  lista.appendChild(btnNova);

  // Carregar cardápio inicial
  fetch('/api/cardapio/mostrarCardapio')
    .then(response => {
      return response.json();
    })
    .then(data => {
      // A API retorna { categorias: [...] }
      const categorias = data.categorias || [];
      
      if (categorias.length === 0) {
        return;
      }
      
      categorias.forEach(categoria => {
        
        const div = document.createElement('div');
        div.className = 'grupo-item';
        div.dataset.id = categoria.idcategoria;

        // Não criar detalhes aqui - usar a área existente

        div.innerHTML = `
          <div class="categoria-handle" title="Arrastar para reordenar">
            <i class="fas fa-bars"></i>
          </div>
          <div class="grupo-header">
            <h3>${categoria.nome}</h3>
            <span class="grupo-count">${(categoria.produtos || []).filter(p => !p.excluido).length} produtos</span>
          </div>
        `;

        // Adicionar event listener para clicar na categoria
        div.addEventListener('click', () => {
          // Remover classe ativa de todas as categorias
          document.querySelectorAll('.grupo-item').forEach(item => {
            item.classList.remove('ativo');
          });
          
          // Adicionar classe ativa à categoria clicada
          div.classList.add('ativo');
          
          // Carregar produtos da categoria
          carregarProdutosCategoria(categoria);
        });

        // Inserir antes do botão "Nova Categoria"
        lista.insertBefore(div, btnNova);
      });
      
      // Inicializar Sortable para categorias
      inicializarSortableCategorias();
    })
    .catch(err => {
      console.error('Erro ao carregar cardápio:', err);
    });
});


// Função para editar categoria
async function editarCategoria(idCategoria) {
  try {
    // Buscar dados da categoria
    const response = await fetch(`/api/categorias/${idCategoria}`);
    const categoria = await response.json();
    
    if (!response.ok) {
      alert('Erro ao carregar dados da categoria: ' + categoria.error);
      return;
    }
    
    // Preencher formulário do modal
    document.getElementById('NovaCategoria').value = categoria.nome;
    
    // Alterar título do modal
    document.querySelector('#modalCategoria h2').textContent = 'Editar Categoria';
    
    // Alterar comportamento do formulário
    formCategoria.dataset.modo = 'editar';
    formCategoria.dataset.idCategoria = idCategoria;
    
    // Mostrar modal
    modalCategoria.style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar categoria:', error);
    alert('Erro ao carregar dados da categoria!');
  }
}

// Função para excluir categoria
async function excluirCategoria(idCategoria) {
  if (!confirm('Tem certeza que deseja excluir esta categoria?\n\nTodos os produtos desta categoria também serão excluídos.')) {
    return;
  }
  
  try {
    showLoading('Excluindo categoria...');
    
    const response = await fetch(`/api/categorias/deletar/${idCategoria}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      hideLoading();
      alert('Categoria excluída com sucesso!');
      // Recarregar a página para atualizar a lista
      location.reload();
    } else {
      hideLoading();
      alert('Erro ao excluir categoria: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    alert('Erro ao excluir categoria!');
  }
}

// Função para carregar categorias no select
async function carregarCategoriasSelect() {
  try {
    const response = await fetch('/api/categorias');
    const categorias = await response.json();
    
    const selectCategoria = document.getElementById('produtoCategoria');
    if (!selectCategoria) {
      console.error('Select de categoria não encontrado!');
      return;
    }
    
    // Limpar opções existentes
    selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    // Adicionar opções das categorias
    categorias.forEach(categoria => {
      if (!categoria.excluido) {
        const option = document.createElement('option');
        option.value = categoria.idcategoria;
        option.textContent = categoria.nome;
        selectCategoria.appendChild(option);
      }
    });
    
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    alert('Erro ao carregar categorias!');
  }
}

// Função para carregar produtos de uma categoria específica
function carregarProdutosCategoria(categoria) {
  
  const produtosLista = document.getElementById('produtosLista');
          if (!produtosLista) {
    console.error('Elemento produtosLista não encontrado!');
    return;
  }

  // Esconder botão de salvar ao carregar nova categoria
  esconderBotaoSalvar();

          // Filtra produtos que não estão excluídos
          const produtosAtivos = (categoria.produtos || []).filter(produto => !produto.excluido);
          
  
  produtosLista.innerHTML = '';

          if (produtosAtivos.length === 0) {
            const aviso = document.createElement('p');
            aviso.textContent = 'Nenhum produto ativo nesta categoria.';
            produtosLista.appendChild(aviso);
            return;
          }

          produtosAtivos.forEach(produto => {
            const prodDiv = document.createElement('div');
            prodDiv.className = 'produto-box';
    prodDiv.dataset.id = produto.idproduto;

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

            const disponivel = produto.disponivel !== undefined ? produto.disponivel : 1;
            prodDiv.innerHTML = `
            <div class="produto-handle" title="Arrastar para reordenar">
              <i class="fas fa-bars"></i>
            </div>

            <div class="produto-conteudo">
              <div class="produto-img">
                ${srcImg ? 
                  `<img src="${srcImg}" alt="Imagem do produto" onerror="if(!this.dataset.errorHandled){this.dataset.errorHandled='true';this.onerror=null;this.parentElement.innerHTML='<div class=\\'placeholder-img\\'><i class=\\'fas fa-image\\'></i><span>Imagem não encontrada</span></div>';}">` : 
                  `<div class="placeholder-img"><i class="fas fa-image"></i><span>Sem imagem</span></div>`
                }
              </div>

              <div class="produto-info">
                <h4>${produto.nome}</h4>
                <p>${produto.descricao}</p>
                <span class="produto-preco">R$ ${precoFormatado}</span>
              </div>
            </div>

            <div class="produto-botoes">
              <div class="produto-disponibilidade">
                <label class="switch-label">
                  <span class="switch-text">Disponível</span>
                  <label class="switch">
                    <input type="checkbox" class="switch-disponivel" data-id="${produto.idproduto}" ${disponivel ? 'checked' : ''}>
                    <span class="slider"></span>
                  </label>
                </label>
              </div>
              <button title="Editar" class="btn-editar" data-id="${produto.idproduto}"><i class="fas fa-pen"></i></button>
              <button title="Opcionais" class="btn-opcionais" data-id="${produto.idproduto}"><i class="fas fa-martini-glass"></i></button>
              <button title="Excluir" class="btn-excluir" data-id="${produto.idproduto}"><i class="fas fa-trash"></i></button>
            </div>
          `;

            produtosLista.appendChild(prodDiv);
          });

  // Adicionar event listeners para os botões dos produtos
  adicionarEventListenersProdutos();
  
  // Adicionar event listeners para os switches de disponibilidade
  adicionarEventListenersDisponibilidade();

          // Destruir instância anterior do Sortable se existir
          if (sortableInstance) {
            sortableInstance.destroy();
          }

          // Ativa o Sortable
          sortableInstance = Sortable.create(produtosLista, {
            handle: '.produto-handle',
            animation: 150,
            ghostClass: 'drag-ghost',
            onEnd: function(evt) {
              // Marcar que a ordenação foi alterada e mostrar botão de salvar
              ordenacaoAlterada = true;
              mostrarBotaoSalvar();
            }
  });
}

// Função para reordenar produtos no backend
async function reordenarProdutos() {
  try {
    const produtosLista = document.getElementById('produtosLista');
    const produtos = Array.from(produtosLista.children).map((elemento, index) => {
      const idProduto = elemento.getAttribute('data-id');
      return { idproduto: parseInt(idProduto) };
    });

    const response = await fetch('/api/produtos/reordenar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ produtos })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Produtos reordenados com sucesso!');
      
      // Recarregar a categoria atual para mostrar a nova ordem
      const categoriaAtiva = document.querySelector('.grupo-item.ativo');
      if (categoriaAtiva) {
        const idCategoria = categoriaAtiva.dataset.id;
        await recarregarCategoria(idCategoria);
      }
    } else {
      console.error('Erro ao reordenar produtos:', result.error);
      alert('Erro ao reordenar produtos: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao reordenar produtos:', error);
    alert('Erro ao reordenar produtos!');
  }
}

// Função para mostrar o botão de salvar ordenação
function mostrarBotaoSalvar() {
  const btnSalvar = document.getElementById('btnSalvarOrdenacao');
  if (btnSalvar) {
    btnSalvar.style.display = 'inline-block';
  }
}

// Função para esconder o botão de salvar ordenação
function esconderBotaoSalvar() {
  const btnSalvar = document.getElementById('btnSalvarOrdenacao');
  if (btnSalvar) {
    btnSalvar.style.display = 'none';
  }
  ordenacaoAlterada = false;
}

// Função para salvar a ordenação atual
async function salvarOrdenacao() {
  if (!ordenacaoAlterada) return;
  
  try {
    showLoading('Salvando ordenação...');
    
    const produtosLista = document.getElementById('produtosLista');
    const produtos = Array.from(produtosLista.children).map((elemento, index) => {
      const idProduto = elemento.getAttribute('data-id');
      return { idproduto: parseInt(idProduto) };
    });

    const response = await fetch('/api/produtos/reordenar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ produtos })
    });

    const result = await response.json();

    if (response.ok) {
      // Esconder o botão de salvar
      esconderBotaoSalvar();
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar a página para garantir que os dados mais recentes sejam carregados
      window.location.reload();
    } else {
      hideLoading();
      alert('Erro ao reordenar produtos: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    alert('Erro ao reordenar produtos!');
  }
}

// Função para inicializar Sortable para categorias
function inicializarSortableCategorias() {
  const listaCategorias = document.getElementById('listaCategorias');
  if (!listaCategorias) return;

  // Destruir instância anterior se existir
  if (sortableCategoriasInstance) {
    sortableCategoriasInstance.destroy();
  }

  // Criar instância do Sortable para categorias
  // Excluir o botão "Nova Categoria" e o botão de salvar da ordenação
  sortableCategoriasInstance = Sortable.create(listaCategorias, {
    handle: '.categoria-handle',
    animation: 150,
    ghostClass: 'drag-ghost',
    filter: '.btn-novo-grupo, .btn-salvar-categorias', // Excluir botões do drag
    onEnd: function(evt) {
      // Marcar que a ordenação foi alterada e mostrar botão de salvar
      ordenacaoCategoriasAlterada = true;
      mostrarBotaoSalvarCategorias();
    }
  });
}

// Função para mostrar o botão de salvar ordenação de categorias
function mostrarBotaoSalvarCategorias() {
  const btnSalvar = document.getElementById('btnSalvarOrdenacaoCategorias');
  if (btnSalvar) {
    btnSalvar.style.display = 'block';
  }
}

// Função para esconder o botão de salvar ordenação de categorias
function esconderBotaoSalvarCategorias() {
  const btnSalvar = document.getElementById('btnSalvarOrdenacaoCategorias');
  if (btnSalvar) {
    btnSalvar.style.display = 'none';
  }
  ordenacaoCategoriasAlterada = false;
}

// Função para salvar a ordenação de categorias
async function salvarOrdenacaoCategorias() {
  if (!ordenacaoCategoriasAlterada) return;
  
  try {
    showLoading('Salvando ordenação das categorias...');
    
    const listaCategorias = document.getElementById('listaCategorias');
    if (!listaCategorias) {
      hideLoading();
      alert('Lista de categorias não encontrada');
      return;
    }
    
    // Pegar os elementos filhos diretamente (após o Sortable reorganizar) - igual aos produtos
    const categorias = Array.from(listaCategorias.children)
      .filter(elemento => elemento.classList.contains('grupo-item'))
      .map((elemento) => {
        const idCategoria = elemento.getAttribute('data-id');
        return { idcategoria: parseInt(idCategoria) };
      })
      .filter(cat => !isNaN(cat.idcategoria)); // Remover categorias inválidas

    if (categorias.length === 0) {
      hideLoading();
      alert('Nenhuma categoria válida encontrada para reordenar');
      return;
    }

    const response = await fetch('/api/categorias/reordenar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categorias })
    });

    const result = await response.json();

    if (response.ok) {
      // Esconder o botão de salvar
      esconderBotaoSalvarCategorias();
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar a página para garantir que os dados mais recentes sejam carregados
      window.location.reload();
    } else {
      hideLoading();
      alert('Erro ao reordenar categorias: ' + (result.error || 'Erro desconhecido'));
    }
  } catch (error) {
    hideLoading();
    alert('Erro ao reordenar categorias!');
  }
}

// Função para recarregar uma categoria específica com retry
async function recarregarCategoria(idCategoria, tentativas = 0) {
  const maxTentativas = 3;
  
  try {
    const response = await fetch('/api/cardapio/mostrarCardapio', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await response.json();
    
    if (response.ok && data.categorias) {
      const categoria = data.categorias.find(cat => cat.idcategoria == idCategoria);
      if (categoria && categoria.produtos && categoria.produtos.length > 0) {
        carregarProdutosCategoria(categoria);
        return; // Sucesso, sair da função
      } else if (categoria && (!categoria.produtos || categoria.produtos.length === 0)) {
        if (tentativas < maxTentativas) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (tentativas + 1))); // Delay progressivo
          return recarregarCategoria(idCategoria, tentativas + 1);
        }
      }
    } else {
      if (tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (tentativas + 1)));
        return recarregarCategoria(idCategoria, tentativas + 1);
      }
    }
  } catch (error) {
    if (tentativas < maxTentativas) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (tentativas + 1)));
      return recarregarCategoria(idCategoria, tentativas + 1);
    }
  }
}

// Função para adicionar event listeners aos botões dos produtos
function adicionarEventListenersProdutos() {
  // Botões de editar produto
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idProduto = btn.getAttribute('data-id');
      editarProduto(idProduto);
    });
  });

  // Botões de opcionais do produto
  document.querySelectorAll('.btn-opcionais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idProduto = btn.getAttribute('data-id');
      gerenciarOpcionais(idProduto);
    });
  });

  // Botões de excluir produto
  document.querySelectorAll('.btn-excluir').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idProduto = btn.getAttribute('data-id');
      excluirProduto(idProduto);
    });
  });
}

// Função para adicionar event listeners aos switches de disponibilidade
function adicionarEventListenersDisponibilidade() {
  document.querySelectorAll('.switch-disponivel').forEach(switchEl => {
    switchEl.addEventListener('change', async (e) => {
      const idProduto = switchEl.getAttribute('data-id');
      const disponivel = switchEl.checked;
      
      try {
        const response = await fetch(`/api/produtos/disponibilidade/${idProduto}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ disponivel: disponivel })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Feedback visual opcional
          const produtoBox = switchEl.closest('.produto-box');
          if (produtoBox) {
            produtoBox.style.opacity = '0.6';
            setTimeout(() => {
              produtoBox.style.opacity = '1';
            }, 200);
          }
        } else {
          // Reverter o switch em caso de erro
          switchEl.checked = !disponivel;
          alert('Erro ao atualizar disponibilidade: ' + result.error);
        }
      } catch (error) {
        // Reverter o switch em caso de erro
        switchEl.checked = !disponivel;
        console.error('Erro ao atualizar disponibilidade:', error);
        alert('Erro ao atualizar disponibilidade do produto!');
      }
    });
  });
}

// Função para editar produto
async function editarProduto(idProduto) {
  try {
    const response = await fetch(`/api/produtos/${idProduto}`);
    const produto = await response.json();
    
    if (!produto) {
      alert('Produto não encontrado!');
      return;
    }

    // Carregar categorias no select primeiro
    await carregarCategoriasSelect();

    // Preencher formulário com dados existentes
    document.getElementById('nomeProduto').value = produto.nome;
    document.getElementById('descricaoProduto').value = produto.descricao;
    document.getElementById('precoProduto').value = produto.preco;
    document.getElementById('produtoCategoria').value = produto.idcategoria;
    
    // Alterar título do modal
    document.querySelector('#modalProduto h2').textContent = 'Editar Produto';
    
    // Alterar comportamento do formulário
    const formProduto = document.getElementById('formProduto');
    formProduto.dataset.modo = 'editar';
    formProduto.dataset.idProduto = idProduto;
    
    // Mostrar imagem existente se houver
    if (produto.imagem) {
      showExistingImage(produto.imagem);
    } else {
      document.getElementById('imagePreview').style.display = 'none';
    }
    
    // Mostrar modal
    modalProduto.style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    alert('Erro ao carregar dados do produto!');
  }
}

// Função para gerenciar grupos de opcionais do produto
async function gerenciarOpcionais(idProduto) {
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}`);
    const grupos = await response.json();
    
    // Criar modal de grupos de opcionais
    criarModalOpcionais(idProduto, grupos);
    
  } catch (error) {
    console.error('Erro ao carregar grupos de opcionais do produto:', error);
    alert('Erro ao carregar grupos de opcionais do produto!');
  }
}

// Função para criar modal de grupos de opcionais do produto
function criarModalOpcionais(idProduto, grupos) {
  // Criar modal se não existir
  let modalOpcionaisProduto = document.getElementById('modalOpcionaisProduto');
  if (!modalOpcionaisProduto) {
    modalOpcionaisProduto = document.createElement('div');
    modalOpcionaisProduto.id = 'modalOpcionaisProduto';
    modalOpcionaisProduto.className = 'modal';
    modalOpcionaisProduto.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>Gerenciar Grupos de Opcionais do Produto</h2>
          <span class="close" id="fecharOpcionaisProduto">&times;</span>
        </div>
        <div class="modal-body">
          <div class="grupos-opcionais-container">
            <div class="grupos-disponiveis">
              <h3>Grupos Disponíveis</h3>
              <div id="listaGruposDisponiveis"></div>
            </div>
            <div class="grupos-produto">
              <h3>Grupos do Produto</h3>
              <div id="listaGruposProduto"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalOpcionaisProduto);
    
    // Event listener para fechar modal
    document.getElementById('fecharOpcionaisProduto').addEventListener('click', () => {
      modalOpcionaisProduto.style.display = 'none';
    });
  }
  
  // Carregar grupos disponíveis
  carregarGruposDisponiveis(idProduto);
  
  // Carregar grupos do produto
  carregarGruposProduto(idProduto);
  
  // Mostrar modal
  modalOpcionaisProduto.style.display = 'block';
}

// Função para carregar grupos disponíveis
async function carregarGruposDisponiveis(idProduto) {
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}/disponiveis`);
    const grupos = await response.json();
    
    const lista = document.getElementById('listaGruposDisponiveis');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (grupos.length === 0) {
      lista.innerHTML = '<p>Nenhum grupo disponível para adicionar.</p>';
      return;
    }
    
    grupos.forEach(grupo => {
      const div = document.createElement('div');
      div.className = 'grupo-item-disponivel';
      
      div.innerHTML = `
        <div class="grupo-info">
          <h4>${grupo.nome}</h4>
          <p>${grupo.descricao || 'Sem descrição'}</p>
          <span class="grupo-contador">${grupo.total_opcionais} opcionais</span>
        </div>
        <button class="btn-adicionar-grupo" data-id="${grupo.idgrupo_opcional}">+ Adicionar</button>
      `;
      
      div.querySelector('.btn-adicionar-grupo').addEventListener('click', () => {
        adicionarGrupoAoProduto(idProduto, grupo.idgrupo_opcional);
      });
      
      lista.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar grupos disponíveis:', error);
  }
}

// Função para carregar grupos do produto
async function carregarGruposProduto(idProduto) {
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}`);
    const grupos = await response.json();
    
    const lista = document.getElementById('listaGruposProduto');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (grupos.length === 0) {
      lista.innerHTML = '<p>Nenhum grupo de opcionais adicionado a este produto.</p>';
      return;
    }
    
    grupos.forEach(grupo => {
      const div = document.createElement('div');
      div.className = 'grupo-item-produto';
      
      div.innerHTML = `
        <div class="grupo-info">
          <h4>${grupo.nome_exibicao || grupo.grupo_nome}</h4>
          <p>${grupo.grupo_descricao || 'Sem descrição'}</p>
          <div class="grupo-config">
            <span class="config-item ${grupo.obrigatorio ? 'obrigatorio' : 'opcional'}">
              ${grupo.obrigatorio ? 'Obrigatório' : 'Opcional'}
            </span>
            ${grupo.maximo_escolhas ? `<span class="config-item">Máx: ${grupo.maximo_escolhas}</span>` : ''}
            ${grupo.minimo_escolhas > 0 ? `<span class="config-item">Mín: ${grupo.minimo_escolhas}</span>` : ''}
          </div>
          <span class="grupo-contador">${grupo.total_opcionais} opcionais</span>
        </div>
        <div class="grupo-botoes">
          <button class="btn-ver-opcionais-grupo" data-id="${grupo.idgrupo_opcional}">Ver Opcionais</button>
          <button class="btn-configurar-grupo" data-id="${grupo.idgrupo_opcional}">Configurar</button>
          <button class="btn-remover-grupo" data-id="${grupo.idgrupo_opcional}">- Remover</button>
        </div>
      `;
      
      // Event listeners
      div.querySelector('.btn-ver-opcionais-grupo').addEventListener('click', () => {
        verOpcionaisDoGrupoNoProduto(idProduto, grupo.idgrupo_opcional);
      });
      
      div.querySelector('.btn-configurar-grupo').addEventListener('click', () => {
        configurarGrupoNoProduto(idProduto, grupo);
      });
      
      div.querySelector('.btn-remover-grupo').addEventListener('click', () => {
        removerGrupoDoProduto(idProduto, grupo.idgrupo_opcional);
      });
      
      lista.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar grupos do produto:', error);
  }
}

// Função para adicionar grupo ao produto
async function adicionarGrupoAoProduto(idProduto, idGrupo) {
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idgrupo_opcional: idGrupo,
        obrigatorio: 0,
        maximo_escolhas: null,
        minimo_escolhas: 0
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Grupo adicionado ao produto com sucesso!');
      carregarGruposDisponiveis(idProduto);
      carregarGruposProduto(idProduto);
    } else {
      alert('Erro ao adicionar grupo: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao adicionar grupo:', error);
    alert('Erro ao adicionar grupo!');
  }
}

// Função para remover grupo do produto
async function removerGrupoDoProduto(idProduto, idGrupo) {
  if (!confirm('Tem certeza que deseja remover este grupo de opcionais do produto?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}/grupo/${idGrupo}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Grupo removido do produto com sucesso!');
      carregarGruposDisponiveis(idProduto);
      carregarGruposProduto(idProduto);
    } else {
      alert('Erro ao remover grupo: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao remover grupo:', error);
    alert('Erro ao remover grupo!');
  }
}

// Função para ver opcionais de um grupo no produto
async function verOpcionaisDoGrupoNoProduto(idProduto, idGrupo) {
  try {
    const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}/grupo/${idGrupo}/opcionais`);
    const opcionais = await response.json();
    
    let mensagem = 'Opcionais disponíveis neste grupo:\n\n';
    opcionais.forEach(opcional => {
      const preco = Number(opcional.preco) || 0;
      mensagem += `• ${opcional.nome} - R$ ${preco.toFixed(2)}\n`;
    });
    
    alert(mensagem);
  } catch (error) {
    console.error('Erro ao carregar opcionais do grupo:', error);
    alert('Erro ao carregar opcionais do grupo!');
  }
}

// Função para configurar grupo no produto
async function configurarGrupoNoProduto(idProduto, grupo) {
  // Criar modal de configuração
  const modalConfig = document.createElement('div');
  modalConfig.className = 'modal';
  modalConfig.innerHTML = `
    <div class="modal-content">
      <span class="close" id="fecharConfigGrupo">&times;</span>
      <h2>Configurar Grupo: ${grupo.grupo_nome}</h2>
      <form id="formConfigGrupo">
        <label for="nomeExibicao">Nome para Exibição</label><br>
        <input type="text" id="nomeExibicao" class="texto" value="${grupo.nome_exibicao || ''}" placeholder="Deixe vazio para usar o nome padrão"><br>
        
        <label for="obrigatorio">Obrigatório</label><br>
        <select id="obrigatorio" class="texto">
          <option value="0" ${!grupo.obrigatorio ? 'selected' : ''}>Opcional</option>
          <option value="1" ${grupo.obrigatorio ? 'selected' : ''}>Obrigatório</option>
        </select><br>
        
        <label for="minimoEscolhas">Mínimo de Escolhas</label><br>
        <input type="number" id="minimoEscolhas" class="texto" value="${grupo.minimo_escolhas || 0}" min="0"><br>
        
        <label for="maximoEscolhas">Máximo de Escolhas</label><br>
        <input type="number" id="maximoEscolhas" class="texto" value="${grupo.maximo_escolhas || ''}" min="1" placeholder="Deixe vazio para ilimitado"><br>
        
        <label for="instrucoes">Instruções Especiais</label><br>
        <textarea id="instrucoes" class="texto" placeholder="Instruções específicas para este produto...">${grupo.instrucoes || ''}</textarea><br>
        
        <button type="submit">Salvar Configurações</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modalConfig);
  modalConfig.style.display = 'block';
  
  // Event listeners
  document.getElementById('fecharConfigGrupo').addEventListener('click', () => {
    document.body.removeChild(modalConfig);
  });
  
  document.getElementById('formConfigGrupo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
      nome_exibicao: document.getElementById('nomeExibicao').value.trim() || null,
      obrigatorio: parseInt(document.getElementById('obrigatorio').value),
      minimo_escolhas: parseInt(document.getElementById('minimoEscolhas').value) || 0,
      maximo_escolhas: document.getElementById('maximoEscolhas').value ? parseInt(document.getElementById('maximoEscolhas').value) : null,
      instrucoes: document.getElementById('instrucoes').value.trim() || null
    };
    
    try {
      const response = await fetch(`/api/produto-grupo-opcionais/produto/${idProduto}/grupo/${grupo.idgrupo_opcional}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Configurações salvas com sucesso!');
        document.body.removeChild(modalConfig);
        carregarGruposProduto(idProduto);
      } else {
        alert('Erro ao salvar configurações: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações!');
    }
  });
}

// Função para excluir produto
async function excluirProduto(idProduto) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) {
    return;
  }
  
  try {
    showLoading('Excluindo produto...');
    
    const response = await fetch(`/api/produtos/deletar/${idProduto}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      hideLoading();
      alert('Produto excluído com sucesso!');
      location.reload(); // Recarregar página
    } else {
      hideLoading();
      alert('Erro ao excluir produto: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    alert('Erro ao excluir produto!');
  }
}

// Função para alternar entre tabs
function alternarTab(tabIndex) {
  const tabs = document.querySelectorAll('.menu-tabs li');
  const detalhesCategoria = document.getElementById('detalhesCategoria');
  const detalhesOpcionais = document.getElementById('detalhesOpcionais');
  
  // Remover classe active de todas as tabs
  tabs.forEach((tab) => {
    tab.classList.remove('active');
  });
  
  // Adicionar classe active na tab clicada
  if (tabs[tabIndex]) {
    tabs[tabIndex].classList.add('active');
  }
  
  if (tabIndex === 0) {
    // Tab Cardápio Principal
    if (detalhesCategoria) {
      detalhesCategoria.style.display = 'block';
    }
    if (detalhesOpcionais) {
      detalhesOpcionais.style.display = 'none';
    }
  } else if (tabIndex === 1) {
    // Tab Opcionais
    if (detalhesCategoria) {
      detalhesCategoria.style.display = 'none';
    }
    if (detalhesOpcionais) {
      detalhesOpcionais.style.display = 'block';
    }
    carregarOpcionais();
  }
}

// Função para carregar opcionais (agora apenas grupos)
async function carregarOpcionais() {
  try {
    // Carregar apenas grupos de opcionais
    await carregarGruposOpcionais();
  } catch (error) {
    console.error('Erro ao carregar grupos de opcionais:', error);
  }
}

// Função para adicionar event listeners aos botões de opcionais
function adicionarEventListenersOpcionais() {
  // Botões de editar opcional
  document.querySelectorAll('.btn-editar-opcional').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idOpcional = btn.getAttribute('data-id');
      editarOpcional(idOpcional);
    });
  });

  // Botões de excluir opcional
  document.querySelectorAll('.btn-excluir-opcional').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idOpcional = btn.getAttribute('data-id');
      excluirOpcional(idOpcional);
    });
  });
}

// Função para editar opcional
async function editarOpcional(idOpcional) {
  try {
    const response = await fetch(`/api/opcionais/${idOpcional}`);
    const opcional = await response.json();
    
    if (!opcional) {
      alert('Opcional não encontrado!');
      return;
    }

    // Preencher modal de opcional com dados existentes
    document.getElementById('nomeOpcional').value = opcional.nome;
    document.getElementById('tipoOpcional').value = opcional.tipo;
    document.getElementById('precoOpcional').value = opcional.preco;
    
    // Alterar título do modal
    document.querySelector('#modalOpcional h2').textContent = 'Editar Opcional';
    
    // Alterar comportamento do formulário
    const formOpcional = document.getElementById('formOpcional');
    formOpcional.dataset.modo = 'editar';
    formOpcional.dataset.idOpcional = idOpcional;
    
    // Mostrar modal
    document.getElementById('modalOpcional').style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar opcional:', error);
    alert('Erro ao carregar dados do opcional!');
  }
}

// Função para excluir opcional
async function excluirOpcional(idOpcional) {
  if (!confirm('Tem certeza que deseja excluir este opcional?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/opcionais/deletar/${idOpcional}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Opcional excluído com sucesso!');
      carregarOpcionais(); // Recarregar lista
    } else {
      alert('Erro ao excluir opcional: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao excluir opcional:', error);
    alert('Erro ao excluir opcional!');
  }
}

// Função para inicializar as tabs
function inicializarTabs() {
  const tabs = document.querySelectorAll('.menu-tabs li');
  
  tabs.forEach((tab) => {
    const tabIndex = parseInt(tab.getAttribute('data-tab'));
    
    // Adicionar event listener diretamente
    tab.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      alternarTab(tabIndex);
    };
  });
}


// ===== FUNÇÕES PARA GRUPOS DE OPCIONAIS =====

// Função para carregar grupos no select
async function carregarGruposSelect() {
  try {
    const response = await fetch('/api/grupos-opcionais');
    const grupos = await response.json();
    
    const selectGrupo = document.getElementById('grupoOpcional');
    if (!selectGrupo) {
      console.error('Select de grupo não encontrado!');
      return;
    }
    
    selectGrupo.innerHTML = '<option value="">Selecione um grupo</option>';
    
    grupos.forEach(grupo => {
      const option = document.createElement('option');
      option.value = grupo.idgrupo_opcional;
      option.textContent = grupo.nome;
      selectGrupo.appendChild(option);
    });
    
  } catch (error) {
    console.error('Erro ao carregar grupos:', error);
    alert('Erro ao carregar grupos!');
  }
}

// Função para carregar grupos de opcionais
async function carregarGruposOpcionais() {
  try {
    const response = await fetch('/api/grupos-opcionais');
    const grupos = await response.json();
    
    const listaGrupos = document.getElementById('listaGruposOpcionais');
    if (!listaGrupos) {
      console.error('Lista de grupos não encontrada!');
      return;
    }
    
    listaGrupos.innerHTML = '';
    
    for (const grupo of grupos) {
      // Buscar opcionais do grupo
      const opcionaisResponse = await fetch(`/api/grupos-opcionais/${grupo.idgrupo_opcional}/opcionais`);
      const opcionais = await opcionaisResponse.json();
      
      const card = document.createElement('div');
      card.className = 'grupo-opcional-card';
      card.dataset.id = grupo.idgrupo_opcional;
      
      // Criar lista de opcionais
      let opcionaisHTML = '';
      if (opcionais.length > 0) {
        opcionaisHTML = `
          <div class="grupo-opcionais-lista">
            <h5>Opcionais:</h5>
            <ul>
              ${opcionais.map(opcional => {
                const preco = Number(opcional.preco) || 0;
                return `
                  <li class="opcional-item-grupo">
                    <span class="opcional-nome">${opcional.nome}</span>
                    <span class="opcional-preco">R$ ${preco.toFixed(2)}</span>
                    <div class="opcional-botoes-grupo">
                      <button class="btn-editar-opcional-grupo" data-id="${opcional.idopcional}" data-grupo="${grupo.idgrupo_opcional}">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-excluir-opcional-grupo" data-id="${opcional.idopcional}" data-grupo="${grupo.idgrupo_opcional}">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
      } else {
        opcionaisHTML = '<div class="grupo-opcionais-lista"><p>Nenhum opcional cadastrado neste grupo.</p></div>';
      }
      
      card.innerHTML = `
        <div class="grupo-opcional-header">
          <h4 class="grupo-opcional-nome">${grupo.nome}</h4>
          <span class="grupo-opcional-contador">${grupo.total_opcionais} opcionais</span>
        </div>
        <div class="grupo-opcional-descricao">${grupo.descricao || 'Sem descrição'}</div>
        ${opcionaisHTML}
        <div class="grupo-opcional-botoes">
          <button class="btn-adicionar-opcional-grupo" data-id="${grupo.idgrupo_opcional}">
            <i class="fas fa-plus"></i> Adicionar Opcional
          </button>
          <button class="btn-editar-grupo" data-id="${grupo.idgrupo_opcional}">
            <i class="fas fa-edit"></i> Editar Grupo
          </button>
          <button class="btn-excluir-grupo" data-id="${grupo.idgrupo_opcional}">
            <i class="fas fa-trash"></i> Excluir Grupo
          </button>
        </div>
      `;
      
      listaGrupos.appendChild(card);
    }
    
    // Adicionar event listeners
    adicionarEventListenersGrupos();
    
  } catch (error) {
    console.error('Erro ao carregar grupos de opcionais:', error);
    alert('Erro ao carregar grupos de opcionais!');
  }
}

// Função para adicionar event listeners aos grupos
function adicionarEventListenersGrupos() {
  // Botão adicionar opcional ao grupo
  document.querySelectorAll('.btn-adicionar-opcional-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idGrupo = e.target.closest('button').dataset.id;
      adicionarOpcionalAoGrupo(idGrupo);
    });
  });
  
  // Botão editar opcional do grupo
  document.querySelectorAll('.btn-editar-opcional-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idOpcional = e.target.closest('button').dataset.id;
      const idGrupo = e.target.closest('button').dataset.grupo;
      editarOpcionalDoGrupo(idOpcional, idGrupo);
    });
  });
  
  // Botão excluir opcional do grupo
  document.querySelectorAll('.btn-excluir-opcional-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idOpcional = e.target.closest('button').dataset.id;
      const idGrupo = e.target.closest('button').dataset.grupo;
      excluirOpcionalDoGrupo(idOpcional, idGrupo);
    });
  });
  
  // Botão editar grupo
  document.querySelectorAll('.btn-editar-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idGrupo = e.target.closest('button').dataset.id;
      editarGrupo(idGrupo);
    });
  });
  
  // Botão excluir grupo
  document.querySelectorAll('.btn-excluir-grupo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idGrupo = e.target.closest('button').dataset.id;
      excluirGrupo(idGrupo);
    });
  });
}

// Função para ver opcionais de um grupo
async function verOpcionaisDoGrupo(idGrupo) {
  try {
    const response = await fetch(`/api/grupos-opcionais/${idGrupo}/opcionais`);
    const opcionais = await response.json();
    
    // Criar modal ou seção para mostrar opcionais
    alert(`Opcionais do grupo:\n${opcionais.map(o => `• ${o.nome} - R$ ${Number(o.preco).toFixed(2)}`).join('\n')}`);
    
  } catch (error) {
    console.error('Erro ao carregar opcionais do grupo:', error);
    alert('Erro ao carregar opcionais do grupo!');
  }
}

// Função para adicionar opcional ao grupo
async function adicionarOpcionalAoGrupo(idGrupo) {
  // Limpar formulário
  document.getElementById('nomeOpcional').value = '';
  document.getElementById('tipoOpcional').value = '';
  document.getElementById('precoOpcional').value = '0';
  
  // Carregar grupos para o select
  await carregarGruposSelect();
  
  // Definir o grupo selecionado
  const grupoSelect = document.getElementById('grupoOpcional');
  grupoSelect.value = idGrupo;
  
  // Mostrar campo de grupo
  const grupoContainer = document.getElementById('grupoOpcionalContainer');
  grupoContainer.style.display = 'block';
  
  // Alterar título do modal
  document.querySelector('#modalOpcional h2').textContent = 'Novo Opcional';
  
  // Alterar comportamento do formulário
  formOpcional.dataset.modo = 'inserir';
  delete formOpcional.dataset.idOpcional;
  
  // Mostrar modal
  modalOpcional.style.display = 'block';
}

// Função para editar opcional do grupo
async function editarOpcionalDoGrupo(idOpcional, idGrupo) {
  try {
    const response = await fetch(`/api/opcionais/${idOpcional}`);
    const opcional = await response.json();
    
    // Preencher formulário
    document.getElementById('nomeOpcional').value = opcional.nome;
    document.getElementById('tipoOpcional').value = opcional.tipo;
    document.getElementById('precoOpcional').value = opcional.preco;
    
    // Ocultar campo de grupo (já está no grupo correto)
    const grupoContainer = document.getElementById('grupoOpcionalContainer');
    grupoContainer.style.display = 'none';
    
    // Alterar título do modal
    document.querySelector('#modalOpcional h2').textContent = 'Editar Opcional';
    
    // Alterar comportamento do formulário
    formOpcional.dataset.modo = 'editar';
    formOpcional.dataset.idOpcional = idOpcional;
    formOpcional.dataset.idGrupo = idGrupo; // Armazenar o ID do grupo para uso posterior
    
    // Mostrar modal
    modalOpcional.style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar opcional:', error);
    alert('Erro ao carregar dados do opcional!');
  }
}

// Função para excluir opcional do grupo
async function excluirOpcionalDoGrupo(idOpcional, idGrupo) {
  if (!confirm('Tem certeza que deseja excluir este opcional?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/opcionais/deletar/${idOpcional}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Opcional excluído com sucesso!');
      carregarOpcionais(); // Recarregar lista
    } else {
      alert('Erro ao excluir opcional: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao excluir opcional:', error);
    alert('Erro ao excluir opcional!');
  }
}

// Função para editar grupo
async function editarGrupo(idGrupo) {
  try {
    const response = await fetch(`/api/grupos-opcionais/${idGrupo}`);
    const grupo = await response.json();
    
    // Preencher formulário
    document.getElementById('nomeGrupoOpcional').value = grupo.nome;
    document.getElementById('descricaoGrupoOpcional').value = grupo.descricao || '';
    document.getElementById('posicaoGrupoOpcional').value = grupo.posicao;
    
    // Alterar título e comportamento
    document.querySelector('#modalGrupoOpcional h2').textContent = 'Editar Grupo';
    formGrupoOpcional.dataset.modo = 'editar';
    formGrupoOpcional.dataset.idGrupo = idGrupo;
    
    // Mostrar modal
    modalGrupoOpcional.style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar grupo:', error);
    alert('Erro ao carregar grupo!');
  }
}

// Função para excluir grupo
async function excluirGrupo(idGrupo) {
  if (!confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/grupos-opcionais/deletar/${idGrupo}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Grupo excluído com sucesso!');
      carregarGruposOpcionais(); // Recarregar lista
    } else {
      alert('Erro ao excluir grupo: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    alert('Erro ao excluir grupo!');
  }
}

// Adicionar event listeners para as tabs quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar um pouco para garantir que tudo esteja carregado
  setTimeout(() => {
    inicializarTabs();
  }, 500);
});
