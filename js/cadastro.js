document.getElementById('btnCadastro').addEventListener('click', () => {
    const cpf = document.getElementById('cpf').value;
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    fetch('http://localhost:3000/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, nome, email, senha })
    })
    .then(response => response.json())
    .then(data => {
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'login.html';
    })
    .catch(error => console.error('Erro:', error));
});
