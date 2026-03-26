import { Toast } from '../types';

type Props = {
  toasts: Toast[];
};

export const ToastStack = ({ toasts }: Props) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.kind === 'success' ? 'bg-eco-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
