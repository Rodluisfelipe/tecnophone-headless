'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react';
import { registerToastHandler, unregisterToastHandler } from '@/lib/toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  type: ToastType;
}

let nextId = 0;

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-emerald-500/20',
  error: 'border-red-500/20',
  info: 'border-primary-500/20',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-red-500',
  info: 'text-primary-600',
};

export default function ToasterProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, opts?: { description?: string; type?: ToastType }) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, description: opts?.description, type: opts?.type || 'success' }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    registerToastHandler(addToast);
    return () => unregisterToastHandler();
  }, [addToast]);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border bg-white shadow-xl shadow-gray-200/60 animate-fade-in max-w-sm ${borderColors[t.type]}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[t.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t.message}</p>
              {t.description && <p className="text-xs text-surface-700 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 text-surface-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
