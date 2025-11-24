// Nomes dos dias da semana
// NOTA: Todos os horários são considerados no fuso horário de Brasília, Brasil (UTC-3)
const diasSemana = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo'
};

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

// Função para obter token
function obterToken() {
  return localStorage.getItem('token');
}

// Função para carregar horários
async function carregarHorarios() {
  try {
    const response = await fetch('/api/horarios-funcionamento');
    const horarios = await response.json();

    const lista = document.getElementById('horariosLista');
    lista.innerHTML = '';

    // Criar um item para cada dia da semana (1-7)
    for (let dia = 1; dia <= 7; dia++) {
      const horario = horarios.find(h => h.dia_semana === dia) || {
        dia_semana: dia,
        horario_inicio: '08:00',
        horario_fim: '18:00',
        ativo: 0
      };

      const div = document.createElement('div');
      div.className = 'horario-item';
      div.innerHTML = `
        <div class="dia-semana">${diasSemana[dia]}</div>
        <div class="horario-inputs">
          <label>
            <i class="fas fa-clock"></i> Início:
            <input type="time" 
                   class="horario-inicio" 
                   data-dia="${dia}" 
                   value="${horario.horario_inicio ? horario.horario_inicio.substring(0, 5) : '08:00'}" 
                   ${!horario.ativo ? 'disabled' : ''}>
          </label>
          <span>até</span>
          <label>
            <i class="fas fa-clock"></i> Fim:
            <input type="time" 
                   class="horario-fim" 
                   data-dia="${dia}" 
                   value="${horario.horario_fim ? horario.horario_fim.substring(0, 5) : '18:00'}" 
                   ${!horario.ativo ? 'disabled' : ''}>
          </label>
        </div>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" 
                   class="toggle-ativo" 
                   data-dia="${dia}" 
                   ${horario.ativo ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span class="switch-label">${horario.ativo ? 'Aberto' : 'Fechado'}</span>
        </div>
      `;

      lista.appendChild(div);
    }

    // Adicionar event listeners para os toggles
    document.querySelectorAll('.toggle-ativo').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const dia = parseInt(e.target.dataset.dia);
        const horarioItem = e.target.closest('.horario-item');
        const inicioInput = horarioItem.querySelector('.horario-inicio');
        const fimInput = horarioItem.querySelector('.horario-fim');
        const label = horarioItem.querySelector('.switch-label');

        if (e.target.checked) {
          inicioInput.disabled = false;
          fimInput.disabled = false;
          label.textContent = 'Aberto';
        } else {
          inicioInput.disabled = true;
          fimInput.disabled = true;
          label.textContent = 'Fechado';
        }
      });
    });
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    alert('Erro ao carregar horários!');
  }
}

// Função para salvar horários
async function salvarHorarios() {
  try {
    showLoading('Salvando horários...');

    const horarios = [];
    const horarioItems = document.querySelectorAll('.horario-item');

    horarioItems.forEach(item => {
      const dia = parseInt(item.querySelector('.toggle-ativo').dataset.dia);
      const ativo = item.querySelector('.toggle-ativo').checked;
      const inicio = item.querySelector('.horario-inicio').value;
      const fim = item.querySelector('.horario-fim').value;

      horarios.push({
        dia_semana: dia,
        horario_inicio: inicio + ':00',
        horario_fim: fim + ':00',
        ativo: ativo
      });
    });

    const token = obterToken();
    if (!token) {
      hideLoading();
      alert('Você precisa estar logado para salvar horários!');
      window.location.href = '/login_cadastro';
      return;
    }

    const response = await fetch('/api/horarios-funcionamento/todos', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ horarios })
    });

    const result = await response.json();

    if (response.ok) {
      hideLoading();
      alert('Horários salvos com sucesso!');
      // Recarregar para garantir que está tudo atualizado
      await carregarHorarios();
    } else {
      hideLoading();
      alert('Erro ao salvar horários: ' + (result.error || 'Erro desconhecido'));
    }
  } catch (error) {
    hideLoading();
    console.error('Erro ao salvar horários:', error);
    alert('Erro ao salvar horários!');
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarHorarios();

  const btnSalvar = document.getElementById('btnSalvarHorarios');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarHorarios);
  }
});

