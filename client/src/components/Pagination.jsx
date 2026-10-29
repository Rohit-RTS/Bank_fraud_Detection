// client/src/components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = 'w-8 h-8 flex items-center justify-center rounded text-sm transition-colors';
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btn} text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {start > 1 && <><button onClick={() => onPageChange(1)} className={`${btn} text-slate-400 hover:bg-slate-700`}>1</button><span className="text-slate-600 px-1">…</span></>}
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`${btn} ${p === page ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-700'}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <><span className="text-slate-600 px-1">…</span><button onClick={() => onPageChange(totalPages)} className={`${btn} text-slate-400 hover:bg-slate-700`}>{totalPages}</button></>}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`${btn} text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
