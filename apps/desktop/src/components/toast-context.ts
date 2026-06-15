import { createContext, useContext } from 'react';

export type ToastTone = 'ok' | 'info' | 'warn';

export type ToastInput = {
  title: string;
  body?: string;
  tone?: ToastTone;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  push: (item: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires ToastProvider');
  return ctx;
}
