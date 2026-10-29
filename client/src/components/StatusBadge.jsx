// client/src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    // Transaction
    SUCCESS:       'bg-emerald-900/60 text-emerald-300 border border-emerald-700',
    FAILED:        'bg-red-900/60 text-red-300 border border-red-700',
    PENDING:       'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
    // Alert
    OPEN:          'bg-blue-900/60 text-blue-300 border border-blue-700',
    UNDER_REVIEW:  'bg-orange-900/60 text-orange-300 border border-orange-700',
    CONFIRMED:     'bg-red-900/60 text-red-300 border border-red-700',
    FALSE_POSITIVE:'bg-gray-700/60 text-gray-300 border border-gray-600',
    CLOSED:        'bg-slate-800/60 text-slate-400 border border-slate-600',
    // Account
    ACTIVE:        'bg-emerald-900/60 text-emerald-300 border border-emerald-700',
    FROZEN:        'bg-cyan-900/60 text-cyan-300 border border-cyan-700',
    // Investigation
    IN_PROGRESS:   'bg-orange-900/60 text-orange-300 border border-orange-700',
    RESOLVED:      'bg-emerald-900/60 text-emerald-300 border border-emerald-700',
  };
  const cls = map[status] || 'bg-gray-800 text-gray-400 border border-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
