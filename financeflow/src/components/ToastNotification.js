import React from 'react';
import './ToastNotification.css';

// PUBLIC_INTERFACE
function ToastNotification({ message, type }) {
  // type: 'success', 'warning', 'info', 'error'
  return (
    <div className={`toast-notification toast-${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default ToastNotification;
