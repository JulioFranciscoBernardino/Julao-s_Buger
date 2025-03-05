function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha: password }) // Corrigindo a chave para "senha"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }
        return response.json();
    })
    .then(data => {
        if (data.type === 'admin') {
            window.location.href = 'admin-dashboard.html'; // Redireciona para o painel administrativo
        } else if (data.type === 'cliente') {
            window.location.href = 'index.html'; // Redireciona para a página inicial ou qualquer outra página do cliente
        } else {
            alert('Credenciais inválidas');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert(error.message);
    });
}
