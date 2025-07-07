document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalCategoria');
  const btnAbrir = document.querySelector('.btn-novo-grupo');
  const btnFechar = document.getElementById('Fechar');
  const formCategoria = document.getElementById('formCategoria');
  const inputCategoria = document.getElementById('NovaCategoria'); // certifique-se de que o input tem esse id

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

  formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault(); // evita reload da página

    const nome = inputCategoria.value.trim();
    if (!nome) {
      alert('Informe o nome da categoria!');
      return;
    }

    try {
      const response = await fetch('/api/inserir/inserir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome }) // 'nome' deve casar com o backend
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
