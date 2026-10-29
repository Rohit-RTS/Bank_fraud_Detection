// client/src/pages/FraudRules.jsx
import { useState, useCallback } from 'react';
import { Shield, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { getFraudRules, updateFraudRule } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';

function EditRuleModal({ rule, onClose, onSave }) {
  const [form, setForm] = useState({
    description: rule.description || '',
    threshold_amount: rule.threshold_amount ?? '',
    threshold_count: rule.threshold_count ?? '',
    time_window_minutes: rule.time_window_minutes ?? '',
    risk_score: rule.risk_score ?? 50,
    is_active: rule.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await onSave(rule.rule_id, form);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-white font-semibold">Edit Rule</h3>
            <p className="text-xs text-slate-500 mt-0.5">{rule.rule_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormInput label="Description" type="textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          <FormInput label="Threshold Amount (₹)" type="number" min="0" step="0.01" value={form.threshold_amount} onChange={e => setForm(f => ({...f, threshold_amount: e.target.value}))} placeholder="Leave empty if not applicable" />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Threshold Count" type="number" min="1" value={form.threshold_count} onChange={e => setForm(f => ({...f, threshold_count: e.target.value}))} placeholder="e.g. 5" />
            <FormInput label="Time Window (min)" type="number" min="1" value={form.time_window_minutes} onChange={e => setForm(f => ({...f, time_window_minutes: e.target.value}))} placeholder="e.g. 60" />
          </div>
          <FormInput label="Risk Score (0-100)" type="number" min="0" max="100" value={form.risk_score} onChange={e => setForm(f => ({...f, risk_score: parseInt(e.target.value)}))} />
          <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
            <span className="text-sm text-slate-300">Rule Active</span>
            <button type="button" onClick={() => setForm(f => ({...f, is_active: !f.is_active}))} className={`transition-colors ${form.is_active ? 'text-emerald-400' : 'text-slate-600'}`}>
              {form.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FraudRules() {
  const [search, setSearch] = useState('');
  const [editRule, setEditRule] = useState(null);
  const { toasts, removeToast, toast } = useToast();

  const { data, loading, error, refetch } = useApi(getFraudRules, { search, limit: 50 }, [search]);
  const rules = data?.data || [];
  const handleSearch = useCallback((v) => setSearch(v), []);

  const handleSave = async (id, form) => {
    await updateFraudRule(id, form);
    toast.success('Fraud rule updated successfully');
    refetch();
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search rules…" /></div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rules.length === 0 ? <EmptyState message="No fraud rules found" icon={Shield} /> : rules.map(rule => (
            <div key={rule.rule_id} className={`bg-[#0a1628] border rounded-xl p-5 space-y-3 ${rule.is_active ? 'border-slate-700/60' : 'border-slate-800/40 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{rule.rule_name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{rule.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <button onClick={() => setEditRule(rule)} className="p-1.5 rounded text-slate-400 hover:text-orange-400 hover:bg-orange-900/20 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {rule.threshold_amount != null && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-slate-500">Threshold</p>
                    <p className="text-white font-semibold">{formatCurrency(rule.threshold_amount)}</p>
                  </div>
                )}
                <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                  <p className="text-slate-500">Risk Score</p>
                  <p className={`font-bold ${rule.risk_score >= 75 ? 'text-red-400' : rule.risk_score >= 40 ? 'text-orange-400' : 'text-emerald-400'}`}>{rule.risk_score}</p>
                </div>
                {rule.threshold_count != null && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-slate-500">Max Tx Count</p>
                    <p className="text-white font-semibold">{rule.threshold_count}</p>
                  </div>
                )}
                {rule.time_window_minutes != null && (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-slate-500">Time Window</p>
                    <p className="text-white font-semibold">{rule.time_window_minutes} min</p>
                  </div>
                )}
              </div>
              <p className="text-slate-600 text-xs">Created {formatDate(rule.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {editRule && (
        <EditRuleModal rule={editRule} onClose={() => setEditRule(null)} onSave={handleSave} />
      )}
    </div>
  );
}
