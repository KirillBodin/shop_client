// Простые утилиты для замены Materialize компонентов

// Toast уведомления
export function showToast(message, type = 'info', duration = 3000) {
  // Создаем контейнер для toast если его нет
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Создаем toast элемент
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#4caf50' : '#1976d2'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    margin-bottom: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    pointer-events: auto;
    cursor: pointer;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;

  // Добавляем обработчик клика для закрытия
  toast.addEventListener('click', () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  // Анимация появления
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Автоматическое удаление
  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

function removeToast(toast) {
  if (toast && toast.parentNode) {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Простые модальные окна
export function createModal(id, content, options = {}) {
  // Удаляем существующую модалку если есть
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      ${content}
    </div>
  `;

  // Добавляем стили если их нет
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .modal.active {
        display: flex;
      }
      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
      }
      .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
      }
      .modal-close:hover {
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Функции управления
  const modalAPI = {
    open: () => {
      modal.classList.add('active');
      // Фокус на первый input если есть
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    },
    close: () => {
      modal.classList.remove('active');
    },
    destroy: () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  };

  // Закрытие по клику на overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modalAPI.close();
    }
  });

  // Закрытие по Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modalAPI.close();
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Очистка обработчика при уничтожении
  const originalDestroy = modalAPI.destroy;
  modalAPI.destroy = () => {
    document.removeEventListener('keydown', handleEscape);
    originalDestroy();
  };

  return modalAPI;
}

// Простая замена для window.M.toast
export const M = {
  toast: ({ html, classes = '', displayLength = 3000 }) => {
    let type = 'info';
    if (classes.includes('red')) type = 'error';
    if (classes.includes('green')) type = 'success';
    if (classes.includes('orange')) type = 'warning';
    
    showToast(html, type, displayLength);
  }
};

// Простая замена для window.M.Modal
export const Modal = {
  init: (element, options = {}) => {
    // Возвращаем простой API для совместимости
    return {
      open: () => {
        if (element) {
          element.classList.add('active');
          const firstInput = element.querySelector('input, textarea, select');
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
          }
        }
      },
      close: () => {
        if (element) {
          element.classList.remove('active');
        }
      },
      destroy: () => {
        // Ничего не делаем, элемент остается в DOM
      }
    };
  },
  getInstance: (element) => {
    if (!element) return null;
    return {
      open: () => element.classList.add('active'),
      close: () => element.classList.remove('active'),
      destroy: () => {}
    };
  }
};
