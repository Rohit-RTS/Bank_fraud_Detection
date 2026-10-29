// client/src/pages/Investigations.jsx
import { useState, useCallback } from 'react';
import { Search, PlusCircle, Eye, Pencil, X } from 'lucide-react';
import { getInvestigations, getInvestigationById, createInvestigation, updateInvestigation, getFraudAlerts } from '../services/api';
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
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';

const INV_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

function InvModal({ investigation, onClose, onSave }) {
  const isEdit = !!investigation;
  const { data: alertsData } = useApi(getFraudAlerts, { limit: 100, status: 'OPEN' }, []);
  const openAlerts = alertsData?.data || [];

  const [form, setForm] = useState({
    alert_id: investigation?.alert_id || '',
    investigator_name: investigation?.investigator_name || '',
    investigation_notes: investigation?.investigation_notes || '',
    investigation_status: investigation?.investigation_status || 'PENDING',
    resolution: investigation?.resolution || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.alert_id) { setError('Please select an alert'); return; }
    setSaving(true); setError(null);
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">{isEdit ? 'Edit Investigation' : 'Create Investigation'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Fraud Alert *</label>
              <select value={form.alert_id} onChange={e => setForm(f => ({...f, alert_id: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                <option value="">Select open alert…</option>
                {openAlerts.map(a => <option key={a.alert_id} value={a.alert_id}>Alert #{a.alert_id} — {a.full_name} — {a.rule_name}</option>)}
              </select>
            </div>
          )}
          <FormInput label="Investigator Name" value={form.investigator_name} onChange={e => setForm(f => ({...f, investigator_name: e.target.value}))} placeholder="John Smith" />
          <FormInput label="Investigation Notes" type="textarea" rows={3} value={form.investigation_notes} onChange={e => setForm(f => ({...f, investigation_notes: e.target.value}))} placeholder="Investigation findings…" />
          {isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
              <select value={form.investigation_status} onChange={e => setForm(f => ({...f, investigation_status: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                {INV_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          )}
          <FormInput label="Resolution" value={form.resolution} onChange={e => setForm(f => ({...f, resolution: e.target.value}))} placeholder="Resolution summary…" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Investigations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const { toasts, removeToast, toast } = useToast();

  const params = { search, status: statusFilter, page, limit: 20 };
  const { data, loading, error, refetch } = useApi(getInvestigations, params, [search, statusFilter, page]);

  const investigations = data?.data || [];
  const pagination = data?.pagination;
  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  const handleSave = async (form) => {
    if (modal?.type === 'edit') {
      await updateInvestigation(modal.data.investigation_id, form);
      toast.success('Investigation updated');
    } else {
      await createInvestigation(form);
      toast.success('Investigation created');
    }
    refetch();
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search investigator, ID…" /></div>
        <FilterDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}
          options={INV_STATUSES.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))} placeholder="All Statuses" />
        <button onClick={() => setModal({ type: 'create' })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> New Investigation
        </button>
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
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Alert</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden lg:table-cell">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Risk</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Investigator</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Status</th>
                    <th className="px-4 py-3 text-slate-400 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {investigations.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState message="No investigations found" icon={Search} /></td></tr>
                  ) : investigations.map(inv => (
                    <tr key={inv.investigation_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">#{inv.investigation_id}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">#{inv.alert_id}</td>
                      <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{inv.full_name}</td>
                      <td className="px-4 py-3 text-white hidden lg:table-cell">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><RiskScoreBadge score={inv.risk_score} /></td>
                      <td className="px-4 py-3 text-slate-300">{inv.investigator_name || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.investigation_status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setModal({ type: 'edit', data: inv })} className="p-1.5 rounded text-slate-400 hover:text-orange-400 hover:bg-orange-900/20">
                          <Pencil className="w-4 h-4" />
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

      {modal && (
        <InvModal
          investigation={modal.type === 'edit' ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
