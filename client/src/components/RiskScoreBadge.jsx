// client/src/components/RiskScoreBadge.jsx
import { getRiskLevel } from '../utils/formatters';

export default function RiskScoreBadge({ score }) {
  const level = getRiskLevel(score);
  const styles = {
    high:   'bg-red-900/60 text-red-300 border border-red-600',
    medium: 'bg-orange-900/60 text-orange-300 border border-orange-600',
    low:    'bg-emerald-900/60 text-emerald-300 border border-emerald-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === 'high' ? 'bg-red-400' : level === 'medium' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
      {score}
    </span>
  );
}
