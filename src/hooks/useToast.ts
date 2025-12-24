import { useState, useCallback } from 'react';
import { ToastType } from '../components/common/Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    addToast('success', message);
  }, []);

  const showError = useCallback((message: string) => {
    addToast('error', message);
  }, []);

  const showWarning = useCallback((message: string) => {
    addToast('warning', message);
  }, []);

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning
  };
}