'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    // If type is not explicitly provided, try to infer it from the message
    let finalType = type;
    if (type === 'info') {
      const lowerMsg = String(message).toLowerCase();
      if (lowerMsg.includes('success') || lowerMsg.includes('saved')) {
        finalType = 'success';
      } else if (lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('invalid') || lowerMsg.includes('reject')) {
        finalType = 'error';
      }
    }

    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message: String(message), type: finalType }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.appAlert = (msg) => showToast(msg, 'info');
      
      window.appConfirm = (msg) => {
        return new Promise((resolve) => {
          setConfirmData({
            msg,
            onConfirm: () => {
              setConfirmData(null);
              resolve(true);
            },
            onCancel: () => {
              setConfirmData(null);
              resolve(false);
            }
          });
        });
      };

      window.appPrompt = (msg) => {
        return new Promise((resolve) => {
          // Fallback for prompt since it requires input, keeping it simple as a custom modal is complex for inputs
          // We will use native prompt but styled later if needed. For now, use window._prompt or just fallback to confirm
          const val = window.prompt(msg);
          resolve(val);
        });
      };
    }
  }, [showToast]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={20} className={styles.iconSuccess} />;
      case 'error': return <AlertCircle size={20} className={styles.iconError} />;
      default: return <Info size={20} className={styles.iconInfo} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.toastIconWrapper}>
              {getIcon(toast.type)}
            </div>
            <div className={styles.toastMessage}>
              {toast.message}
            </div>
            <button className={styles.toastCloseBtn} onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
            <div className={styles.progressBar} />
          </div>
        ))}
      </div>
      
      {/* Confirm Modal */}
      {confirmData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle color="#ef4444" />
              Confirmation Required
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              {confirmData.msg}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={confirmData.onCancel} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmData.onConfirm} style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Confirm Action</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
