// client/src/components/StatCard.jsx
export default function StatCard({ title, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-500/10 border-blue-500/20',    icon: 'text-blue-400',    val: 'text-blue-300' },
    green:  { bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'text-emerald-400', val: 'text-emerald-300' },
    red:    { bg: 'bg-red-500/10 border-red-500/20',      icon: 'text-red-400',     val: 'text-red-300' },
    orange: { bg: 'bg-orange-500/10 border-orange-500/20',icon: 'text-orange-400',  val: 'text-orange-300' },
    cyan:   { bg: 'bg-cyan-500/10 border-cyan-500/20',    icon: 'text-cyan-400',    val: 'text-cyan-300' },
    purple: { bg: 'bg-purple-500/10 border-purple-500/20',icon: 'text-purple-400',  val: 'text-purple-300' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 ${c.bg} bg-[#0f2040]/60`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-2xl font-bold ${c.val} truncate`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg bg-slate-800/60 ${c.icon} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
