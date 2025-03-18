function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Preencha todos os campos!');
        return;
    }

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error); // Exibe erro do backend
        } else if (data.type === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (data.type === 'cliente') {
            window.location.href = 'index.html';
        } else {
            alert('Tipo de usuário desconhecido.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao conectar ao servidor. Tente novamente.');
    });
}

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


// Alternar entre Login e Cadastro
document.querySelector('.register-btn').addEventListener('click', () => {
    document.querySelector('.container').classList.add('active');
});

document.querySelector('.login-btn').addEventListener('click', () => {
    document.querySelector('.container').classList.remove('active');
});
