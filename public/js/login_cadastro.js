document.addEventListener("DOMContentLoaded", function () {

    // Botões de Toggle (Login / Cadastro)
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    const loginForm = document.querySelector('.form-box.login');
    const registerForm = document.querySelector('.form-box.register');
    const container = document.querySelector('.container');

    // Função para alternar entre os formulários
    function toggleForms() {
        container.classList.toggle('active');
    }

    loginBtn.addEventListener('click', function () {
        // Exibe o formulário de login e esconde o de cadastro
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
        toggleForms();  // Ativa a animação de transição
    });

    registerBtn.addEventListener('click', function () {
        // Exibe o formulário de cadastro e esconde o de login
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        toggleForms();  // Ativa a animação de transição
    });

    // Função de Login
    async function login() {
        const email = document.getElementById('email').value;
        const senha = String(document.getElementById('password').value);

        console.log('Tentando login com:', { email, password });
        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();
            console.log('Resposta do login:', data);

            if (data.token) {
                alert('Login bem-sucedido!');
                localStorage.setItem('token', data.token);

                window.location.href = '/';
            } else {
                alert('Erro no login: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao tentar fazer login:', error);
        }
    }

    // Função de Cadastro
    async function cadastro() {
        const cpf = document.getElementById('cpf').value;
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('emailCadastro').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        console.log('Tentando cadastrar com:', { cpf, nome, email, senha });

        try {
            const response = await fetch('/api/usuarios/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cpf, nome, email, senha })
            });

            const data = await response.json();
            console.log('Resposta do cadastro:', data);

            if (data.message) {
                // Esconde o formulário de cadastro e mostra o de login
                document.querySelector('.form-box.register').style.display = 'none';
                document.querySelector('.form-box.login').style.display = 'flex';
                toggleForms();  // Ativa a animação de transição
            } else {
                alert('Erro no cadastro: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao tentar fazer o cadastro:', error);
            alert('Erro ao cadastrar. Verifique o console.');
        }
    }


    // Atribuindo funções de submit aos botões
    document.querySelector('.form-box.login form').addEventListener('submit', function (event) {
        event.preventDefault();
        login();
    });

    document.querySelector('.form-box.register form').addEventListener('submit', function (event) {
        event.preventDefault();
        cadastro();
    });
});
