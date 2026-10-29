// client/src/components/ErrorMessage.jsx
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-xl">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <p className="text-red-400 font-medium">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      )}
    </div>
  );
}
