'use client';
import { ToastMessage } from '@/types';

interface Props {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const typeConfig = {
  success: { bg: 'bg-green-600', icon: '✓' },
  error: { bg: 'bg-red-600', icon: '✕' },
  info: { bg: 'bg-blue-600', icon: 'ℹ' },
};

export function Toast({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const cfg = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 toast-enter`}
          >
            <span className="text-lg font-bold flex-shrink-0">{cfg.icon}</span>
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 opacity-80 hover:opacity-100 text-lg leading-none"
            >×</button>
          </div>
        );
      })}
    </div>
  );
}
