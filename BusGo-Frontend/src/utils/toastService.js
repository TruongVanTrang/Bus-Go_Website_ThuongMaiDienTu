// Toast Notification Service
// Usage: toast.success('message'), toast.error('message'), toast.info('message'), toast.warning('message')

let toastContainer = null
let toastId = 0

export const initToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

const createToastElement = (message, type = 'info', duration = 4000, action = null) => {
  const container = initToastContainer()
  const id = toastId++
  
  const toastEl = document.createElement('div')
  toastEl.id = `toast-${id}`
  toastEl.className = `toast toast-${type}`
  
  // Define colors for each type
  const colors = {
    success: { bg: '#10b981', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    warning: { bg: '#f59e0b', icon: '!' },
    info: { bg: '#3b82f6', icon: 'ℹ' }
  }
  
  const color = colors[type] || colors.info
  
  toastEl.style.cssText = `
    background: ${color.bg};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideInRight 0.3s ease;
    pointer-events: auto;
    font-weight: 500;
    font-size: 14px;
    max-width: 100%;
    word-wrap: break-word;
    line-height: 1.4;
  `
  
  toastEl.innerHTML = `
    <span style="font-size: 18px; flex-shrink: 0;">${color.icon}</span>
    <span style="flex: 1;">${escapeHtml(message)}</span>
    ${action ? `<button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; margin-left: auto; flex-shrink: 0;">${action.label}</button>` : ''}
    <button style="background: transparent; border: none; color: white; cursor: pointer; padding: 0; font-size: 18px; flex-shrink: 0; line-height: 1;">×</button>
  `
  
  container.appendChild(toastEl)
  
  // Add animation styles if not already added
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(400px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(400px);
        }
      }
      
      .toast {
        animation: slideInRight 0.3s ease;
      }
      
      .toast.removing {
        animation: slideOutRight 0.3s ease forwards;
      }
      
      @media (max-width: 640px) {
        #toast-container {
          left: 10px !important;
          right: 10px !important;
          max-width: none !important;
        }
        
        .toast {
          max-width: 100%;
        }
      }
    `
    document.head.appendChild(style)
  }
  
  // Close button handler
  const closeBtn = toastEl.querySelector('button:last-child')
  closeBtn.addEventListener('click', () => removeToast(id))
  
  // Action button handler
  if (action) {
    const actionBtn = toastEl.querySelector('button:not(:last-child)')
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        action.onClick?.()
        removeToast(id)
      })
    }
  }
  
  // Auto-remove after duration
  if (duration > 0) {
    const timeout = setTimeout(() => removeToast(id), duration)
    toastEl.dataset.timeout = timeout
  }
  
  return { id, element: toastEl }
}

const removeToast = (id) => {
  const toastEl = document.getElementById(`toast-${id}`)
  if (toastEl) {
    if (toastEl.dataset.timeout) {
      clearTimeout(toastEl.dataset.timeout)
    }
    toastEl.classList.add('removing')
    setTimeout(() => {
      toastEl.remove()
    }, 300)
  }
}

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

export const toast = {
  success: (message, duration = 4000, action = null) => {
    createToastElement(message, 'success', duration, action)
  },
  error: (message, duration = 5000, action = null) => {
    createToastElement(message, 'error', duration, action)
  },
  warning: (message, duration = 4000, action = null) => {
    createToastElement(message, 'warning', duration, action)
  },
  info: (message, duration = 3000, action = null) => {
    createToastElement(message, 'info', duration, action)
  },
  // For permanent notifications (must be manually closed)
  permanent: (message, type = 'info', action = null) => {
    createToastElement(message, type, -1, action)
  }
}

export default toast
