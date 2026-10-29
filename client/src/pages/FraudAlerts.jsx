// client/src/pages/FraudAlerts.jsx
import { useState, useCallback } from 'react';
import { ShieldAlert, Eye, X } from 'lucide-react';
import { getFraudAlerts, getFraudAlertById, updateAlertStatus } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import StatusBadge from '../components/StatusBadge';
import RiskScoreBadge from '../components/RiskScoreBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';

const ALERT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'];

function AlertDetailModal({ alertId, onClose, onStatusUpdate }) {
  const { data, loading, error, refetch } = useApi(getFraudAlertById, alertId, [alertId]);
  const alert = data?.data;
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await updateAlertStatus(alertId, newStatus);
      onStatusUpdate();
      refetch();
    } catch (err) { console.error(err); }
    finally { setUpdating(false); setNewStatus(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-semibold">Fraud Alert #{alertId}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {alert && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-xs">Customer</p><p className="text-white">{alert.full_name}</p></div>
                <div><p className="text-slate-500 text-xs">Account</p><p className="text-white font-mono text-xs">{alert.account_number}</p></div>
                <div><p className="text-slate-500 text-xs">Amount</p><p className="text-white font-bold">{formatCurrency(alert.amount)}</p></div>
                <div><p className="text-slate-500 text-xs">Risk Score</p><RiskScoreBadge score={alert.risk_score} /></div>
                <div><p className="text-slate-500 text-xs">Rule Triggered</p><p className="text-orange-400 text-sm font-medium">{alert.rule_name}</p></div>
                <div><p className="text-slate-500 text-xs">Current Status</p><StatusBadge status={alert.alert_status} /></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs">Fraud Reason</p><p className="text-slate-200 text-sm">{alert.fraud_reason}</p></div>
                <div><p className="text-slate-500 text-xs">Transaction</p><p className="text-slate-300 font-mono">#{alert.transaction_id}</p></div>
                <div><p className="text-slate-500 text-xs">Tx Type</p><p className="text-slate-300">{alert.transaction_type}</p></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs">Rule Description</p><p className="text-slate-400 text-xs">{alert.rule_description}</p></div>
                <div><p className="text-slate-500 text-xs">Created</p><p className="text-slate-400 text-xs">{formatDate(alert.created_at)}</p></div>
                <div><p className="text-slate-500 text-xs">Updated</p><p className="text-slate-400 text-xs">{formatDate(alert.updated_at)}</p></div>
              </div>

              {/* Update Status */}
              <div className="border-t border-slate-700/60 pt-4">
                <p className="text-slate-400 text-xs uppercase font-medium mb-2">Update Status</p>
                <div className="flex gap-2">
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="flex-1 px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Select new status…</option>
                    {ALERT_STATUSES.filter(s => s !== alert.alert_status).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button onClick={handleStatusUpdate} disabled={!newStatus || updating} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
                    {updating ? '…' : 'Update'}
                  </button>
                </div>
              </div>

              {/* Investigation if any */}
              {alert.investigation && (
                <div className="border-t border-slate-700/60 pt-4">
                  <p className="text-slate-400 text-xs uppercase font-medium mb-2">Investigation</p>
                  <div className="bg-slate-800/40 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500 text-xs">Investigator</span><span className="text-white">{alert.investigation.investigator_name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 text-xs">Status</span><StatusBadge status={alert.investigation.investigation_status} /></div>
                    {alert.investigation.investigation_notes && <p className="text-slate-400 text-xs">{alert.investigation.investigation_notes}</p>}
                  </div>
                </div>
              )}

              {/* Audit Logs */}
              {alert.auditLogs?.length > 0 && (
                <div className="border-t border-slate-700/60 pt-4">
                  <p className="text-slate-400 text-xs uppercase font-medium mb-2">Audit Trail ({alert.auditLogs.length})</p>
                  <div className="space-y-1.5">
                    {alert.auditLogs.map(log => (
                      <div key={log.audit_id} className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-1.5 text-xs">
                        <span className="text-slate-400">{log.action}</span>
                        <span className="text-slate-600">{formatDate(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FraudAlerts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const { toasts, removeToast, toast } = useToast();

  const params = { search, status: statusFilter, minRisk, page, limit: 20 };
  const { data, loading, error, refetch } = useApi(getFraudAlerts, params, [search, statusFilter, minRisk, page]);

  const alerts = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  const handleStatusUpdate = () => {
    toast.success('Alert status updated');
    refetch();
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search alerts…" /></div>
        <FilterDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}
          options={ALERT_STATUSES.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))} placeholder="All Statuses" />
        <FilterDropdown value={minRisk} onChange={v => { setMinRisk(v); setPage(1); }}
          options={[{value:'75',label:'High Risk (75+)'},{value:'40',label:'Medium+ (40+)'}]} placeholder="All Risk Levels" />
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
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Alert ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Account</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden lg:table-cell">Rule</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Risk</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden xl:table-cell">Created</th>
                    <th className="px-4 py-3 text-slate-400 text-xs uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {alerts.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState message="No fraud alerts found" icon={ShieldAlert} /></td></tr>
                  ) : alerts.map(a => (
                    <tr key={a.alert_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">#{a.alert_id}</td>
                      <td className="px-4 py-3 text-white font-medium">{a.full_name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">{a.account_number}</td>
                      <td className="px-4 py-3 text-white font-semibold">{formatCurrency(a.amount)}</td>
                      <td className="px-4 py-3 text-orange-400 text-xs hidden lg:table-cell">{a.rule_name}</td>
                      <td className="px-4 py-3"><RiskScoreBadge score={a.risk_score} /></td>
                      <td className="px-4 py-3"><StatusBadge status={a.alert_status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewId(a.alert_id)} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20">
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

      {viewId && <AlertDetailModal alertId={viewId} onClose={() => setViewId(null)} onStatusUpdate={handleStatusUpdate} />}
    </div>
  );
}
