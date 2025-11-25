let taxasEntrega = [];
let taxaEmEdicao = null;
const form = document.getElementById('taxaEntregaForm');
const distanciaInput = document.getElementById('distanciaKm');
const valorInput = document.getElementById('valorTaxa');
const observacaoInput = document.getElementById('observacaoTaxa');
const ativoInput = document.getElementById('taxaAtiva');
const listaContainer = document.getElementById('listaTaxasContainer');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const btnRecarregar = document.getElementById('btnRecarregarTaxas');

document.addEventListener('DOMContentLoaded', () => {
  carregarTaxas();
  form.addEventListener('submit', handleSubmit);
  btnCancelarEdicao?.addEventListener('click', resetarFormulario);
  btnRecarregar?.addEventListener('click', carregarTaxas);
});

function getToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Sessão expirada. Faça login novamente.');
    window.location.href = '/login_cadastro';
    return null;
  }
  return token;
}

async function carregarTaxas() {
  const token = getToken();
  if (!token) return;

  try {
    listaContainer.innerHTML = `
      <div class="lista-empty">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando taxas...</p>
      </div>
    `;
    const resp = await fetch('/api/taxas-entrega/admin', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      throw new Error('Erro ao carregar taxas');
    }
    taxasEntrega = await resp.json();
    renderizarLista();
  } catch (error) {
    console.error(error);
    listaContainer.innerHTML = `
      <div class="lista-empty">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Não foi possível carregar as taxas.</p>
      </div>
    `;
  }
}

function renderizarLista() {
  if (!taxasEntrega.length) {
    listaContainer.innerHTML = `
      <div class="lista-empty">
        <i class="fas fa-map-marker-exclamation"></i>
        <p>Nenhuma taxa cadastrada.</p>
      </div>
    `;
    return;
  }

  const linhas = taxasEntrega.map((taxa) => `
    <tr>
      <td>${taxa.distancia_km.toFixed(1)} km</td>
      <td>R$ ${taxa.valor.toFixed(2)}</td>
      <td>${taxa.observacao ? taxa.observacao : '--'}</td>
      <td>
        <span class="tag-ativa ${!taxa.ativo ? 'tag-inativa' : ''}">
          ${taxa.ativo ? '<i class="fas fa-check"></i> Ativa' : '<i class="fas fa-ban"></i> Inativa'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-edit" onclick="editarTaxa(${taxa.id})">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="excluirTaxa(${taxa.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  listaContainer.innerHTML = `
    <table class="lista-table">
      <thead>
        <tr>
          <th>Distância</th>
          <th>Valor</th>
          <th>Descrição</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  `;
}

async function handleSubmit(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) return;

  const payload = {
    distancia_km: parseFloat(distanciaInput.value),
    valor: parseFloat(valorInput.value),
    observacao: observacaoInput.value.trim() || null,
    ativo: ativoInput.checked,
  };

  if (!payload.distancia_km || !payload.valor) {
    alert('Informe distância e valor válidos.');
    return;
  }

  try {
    const url = taxaEmEdicao ? `/api/taxas-entrega/${taxaEmEdicao}` : '/api/taxas-entrega';
    const metodo = taxaEmEdicao ? 'PUT' : 'POST';
    const resp = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      throw new Error(erro.erro || 'Não foi possível salvar a taxa');
    }

    resetarFormulario();
    await carregarTaxas();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function editarTaxa(id) {
  const taxa = taxasEntrega.find((t) => t.id === id);
  if (!taxa) return;

  taxaEmEdicao = id;
  distanciaInput.value = taxa.distancia_km;
  valorInput.value = taxa.valor;
  observacaoInput.value = taxa.observacao || '';
  ativoInput.checked = !!taxa.ativo;
  btnCancelarEdicao.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
}

function resetarFormulario() {
  taxaEmEdicao = null;
  form.reset();
  ativoInput.checked = true;
  btnCancelarEdicao.hidden = true;
}

async function excluirTaxa(id) {
  const token = getToken();
  if (!token) return;

  if (!confirm('Deseja realmente excluir esta taxa?')) {
    return;
  }

  try {
    const resp = await fetch(`/api/taxas-entrega/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      throw new Error(erro.erro || 'Não foi possível excluir a taxa');
    }

    if (taxaEmEdicao === id) {
      resetarFormulario();
    }
    await carregarTaxas();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

window.editarTaxa = editarTaxa;
window.excluirTaxa = excluirTaxa;

