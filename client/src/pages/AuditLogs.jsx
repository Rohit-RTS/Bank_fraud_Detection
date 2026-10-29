// client/src/pages/AuditLogs.jsx
// audit_logs columns: audit_id, entity_type, entity_id, action, details, risk_score, is_suspicious, fraud_reason, created_at
import { useState, useCallback } from 'react';
import { FileText, Eye, X } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { useApi } from '../hooks/useApi';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RiskScoreBadge from '../components/RiskScoreBadge';
import { formatDate } from '../utils/formatters';

function LogDetailModal({ log, onClose }) {
  const details = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : log.details || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-semibold">Audit Log #{log.audit_id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500 text-xs">Log ID</p><p className="text-white font-mono">#{log.audit_id}</p></div>
            <div><p className="text-slate-500 text-xs">Entity Type</p><p className="text-white">{log.entity_type}</p></div>
            <div><p className="text-slate-500 text-xs">Entity ID</p><p className="text-white font-mono">{log.entity_id}</p></div>
            <div><p className="text-slate-500 text-xs">Action</p><p className="text-blue-400 font-medium">{log.action}</p></div>
            {log.risk_score != null && (
              <div><p className="text-slate-500 text-xs">Risk Score</p><RiskScoreBadge score={log.risk_score} /></div>
            )}
            <div><p className="text-slate-500 text-xs">Suspicious</p><p className={log.is_suspicious ? 'text-red-400 font-semibold' : 'text-slate-400'}>{log.is_suspicious ? 'YES' : 'No'}</p></div>
            {log.fraud_reason && (
              <div className="col-span-2"><p className="text-slate-500 text-xs">Fraud Reason</p><p className="text-orange-400 text-sm">{log.fraud_reason}</p></div>
            )}
            <div className="col-span-2"><p className="text-slate-500 text-xs">Timestamp</p><p className="text-slate-300">{formatDate(log.created_at)}</p></div>
          </div>
          {Object.keys(details).length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-2">Details (JSON)</p>
              <pre className="bg-slate-900/60 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [suspicious, setSuspicious] = useState('');
  const [page, setPage] = useState(1);
  const [viewLog, setViewLog] = useState(null);

  const params = { search, entity_type: entityType, action, suspicious, page, limit: 20 };
  const { data, loading, error, refetch } = useApi(getAuditLogs, params, [search, entityType, action, suspicious, page]);

  const logs = data?.data || [];
  const pagination = data?.pagination;
  const entityTypes = data?.entityTypes || [];
  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search entity type, action, ID…" /></div>
        <FilterDropdown value={entityType} onChange={v => { setEntityType(v); setPage(1); }}
          options={entityTypes.map(e => ({ value: e, label: e }))} placeholder="All Entities" />
        <FilterDropdown value={suspicious} onChange={v => { setSuspicious(v); setPage(1); }}
          options={[{ value: 'true', label: 'Suspicious Only' }]} placeholder="All Logs" />
      </div>

      <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl overflow-hidden">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/40">
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Log ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Entity Type</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Entity ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Action</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Risk</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden lg:table-cell">Suspicious</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden xl:table-cell">Timestamp</th>
                    <th className="px-4 py-3 text-slate-400 text-xs uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {logs.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState message="No audit logs found" icon={FileText} /></td></tr>
                  ) : logs.map(log => (
                    <tr key={log.audit_id} className={`hover:bg-slate-800/30 transition-colors ${log.is_suspicious ? 'border-l-2 border-l-orange-500' : ''}`}>
                      <td className="px-4 py-3 text-slate-500 font-mono">#{log.audit_id}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{log.entity_type}</span></td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{log.entity_id}</td>
                      <td className="px-4 py-3 text-blue-400 text-xs font-medium">{log.action}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{log.risk_score != null ? <RiskScoreBadge score={log.risk_score} /> : <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {log.is_suspicious ? <span className="text-orange-400 text-xs font-semibold">⚠ Yes</span> : <span className="text-slate-600 text-xs">No</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewLog(log)} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {viewLog && <LogDetailModal log={viewLog} onClose={() => setViewLog(null)} />}
    </div>
  );
}
