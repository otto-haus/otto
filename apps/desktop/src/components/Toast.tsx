import React, { useCallback, useMemo, useState } from 'react';
import { ToastContext, type ToastInput } from './toast-context';

type ToastItem = ToastInput & { id: string };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((item: ToastInput) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastItem = { durationMs: 6500, tone: 'info', ...item, id };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.durationMs ?? 6500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone ?? 'info'}`} role="status">
            <div className="toast__title">{t.title}</div>
            {t.body ? <div className="toast__body">{t.body}</div> : null}
            {t.actionLabel && t.onAction ? (
              <button type="button" className="toast__action btn btn--ghost-d" onClick={t.onAction}>
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
