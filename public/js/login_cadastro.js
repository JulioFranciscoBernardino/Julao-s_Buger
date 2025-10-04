document.addEventListener("DOMContentLoaded", function () {

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Botões de Toggle (Login / Cadastro)
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    const loginForm = document.querySelector('.form-box.login');
    const registerForm = document.querySelector('.form-box.register');
    const container = document.querySelector('.container');

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

    // Função para alternar entre os formulários    
    function toggleForms() {
        if (container) {
            container.classList.toggle('active');
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
        // Exibe o formulário de login e esconde o de cadastro
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
        toggleForms();  // Ativa a animação de transição
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function () {
        // Exibe o formulário de cadastro e esconde o de login
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        toggleForms();  // Ativa a animação de transição
        });
    }



    // Função de Login
    async function login() {
        const email = document.getElementById('email').value;
        const senha = String(document.getElementById('password').value);

        const token = localStorage.getItem('token');

        if (token) {
            try {
                const payloadBase64 = token.split('.')[1];
                const payloadJson = atob(payloadBase64);
                const payload = JSON.parse(payloadJson);

                const tipo = payload.type;

                const desejaDeslogar = confirm(
                    `Você já está logado como ${tipo}. Deseja deslogar?`
                );

                if (!desejaDeslogar) {

                    if (tipo === 'admin') {
                        window.location.href = '/admin_dashboard';
                    } else {
                        window.location.href = '/';
                    }
                    return;
                } else {
                    localStorage.removeItem('token');
                    alert('Você foi deslogado.');
                }

            } catch (e) {
                console.error('Erro ao verificar token:', e);
                localStorage.removeItem('token'); // limpa token inválido
            }
        }

        console.log('Tentando login com:', { email, senha });

        try {
            showLoading('Fazendo login...');
            
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (data.token) {
                hideLoading();
                alert('Login bem-sucedido!');
                localStorage.setItem('token', data.token);

                // Decodificar o token para obter o tipo
                const payloadBase64 = data.token.split('.')[1];
                const payloadJson = atob(payloadBase64);
                const payload = JSON.parse(payloadJson);

                // Redirecionar com base no tipo
                if (payload.type === 'admin') {
                    window.location.href = '/admin_dashboard';
                } else if (payload.type === 'cliente') {
                    window.location.href = '/';
                } else {
                    alert('Tipo de usuário não reconhecido.');
                }

            } else {
                hideLoading();
                alert('Erro no login: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao tentar fazer login:', error);
        }
    }



    // Função de Cadastro
    async function cadastro() {
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('emailCadastro').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        console.log('Tentando cadastrar com:', { nome, email, senha });

        try {
            showLoading('Criando conta...');
            
            const response = await fetch('/api/usuarios/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await response.json();

            if (data.message) {
                hideLoading();
                // Esconde o formulário de cadastro e mostra o de login
                document.querySelector('.form-box.register').style.display = 'none';
                document.querySelector('.form-box.login').style.display = 'flex';
                toggleForms()
            } else {
                hideLoading();
                alert('Erro no cadastro: ' + data.error);
            }
        } catch (error) {
            hideLoading();
            alert('Erro ao cadastrar. Tente novamente.');
        }
    }


    // Atribuindo funções de submit aos botões
    const loginFormElement = document.querySelector('.form-box.login form');
    const registerFormElement = document.querySelector('.form-box.register form');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function (event) {
            event.preventDefault();
            login();
        });
    }

    if (registerFormElement) {
        registerFormElement.addEventListener('submit', function (event) {
            event.preventDefault();
            cadastro();
        });
    }
});

function logout() {
    localStorage.removeItem('token');
    alert('Logout realizado com sucesso!');
    window.location.href = '/login_cadastro.html';
}


