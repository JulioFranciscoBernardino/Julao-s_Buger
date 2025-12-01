// Sistema de Notificações Toast

// Funções de notificação toast
function showToast(message, type = 'info', title = null) {
  const container = getOrCreateToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const titlesDefault = {
    success: 'Sucesso!',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
  };
  
  // Se não tiver título, usar a mensagem como título principal
  const displayTitle = title || message;
  const showMessage = title ? message : '';
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <p class="toast-title">${displayTitle}</p>
      ${showMessage ? `<p class="toast-message">${showMessage}</p>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Remover automaticamente após 3 segundos
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
  
  return toast;
}

function getOrCreateToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showSuccess(message, title = null) {
  return showToast(message, 'success', title);
}

function showError(message, title = null) {
  return showToast(message, 'error', title);
}

function showWarning(message, title = null) {
  return showToast(message, 'warning', title);
}

function showInfo(message, title = null) {
  return showToast(message, 'info', title);
}

