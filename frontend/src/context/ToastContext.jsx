import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    ring: 'ring-emerald-100',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600',
    ring: 'ring-red-100',
    bar: 'bg-red-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-600',
    ring: 'ring-brand-100',
    bar: 'bg-brand-500',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type, message, title) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current.slice(-4), { id, type, message, title }]);
      const timer = setTimeout(() => dismiss(id), type === 'error' ? 6500 : 4500);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, title = 'Success') => push('success', message, title),
      error: (message, title = 'Something went wrong') => push('error', message, title),
      info: (message, title = 'Heads up') => push('info', message, title),
      dismiss,
    }),
    [push, dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((item) => {
          const style = STYLES[item.type] || STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pr-10 shadow-lift ring-4 animate-slide-up',
                style.ring
              )}
              role="status"
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
              <div className="flex gap-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconClass)} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 break-words text-sm leading-5 text-slate-600">{item.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="absolute right-2 top-2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context.toast;
};
