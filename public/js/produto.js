document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalProduto');
  const btnAbrir = document.querySelector('.btn-novo-produto');
  const btnFechar = document.getElementById('Fechar');
  const formProduto = document.getElementById('formProduto');

  //FORM PRODUTO
  const nome = document.getElementById('nome'); 

  btnAbrir.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault(); // evita reload da página

    const nome = nome.value.trim();
    if (!nome) {
      alert('Informe o nome do produto!');
      return;
    }

    try {
      const response = await fetch('/api/produtos/inserir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome }) 
      });

      const data = await response.json();
      console.log('Resposta do cadastro:', data);

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
});
