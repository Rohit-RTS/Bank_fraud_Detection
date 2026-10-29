// client/src/components/Toast.jsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />)}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-emerald-900/90 border-emerald-600 text-emerald-200',
    error:   'bg-red-900/90 border-red-600 text-red-200',
  };
  const Icon = toast.type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg backdrop-blur ${styles[toast.type] || styles.success}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={onRemove} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}
