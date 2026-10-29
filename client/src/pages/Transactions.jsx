// client/src/pages/Transactions.jsx
import { useState, useCallback } from 'react';
import { PlusCircle, Eye, ArrowLeftRight, X, AlertTriangle } from 'lucide-react';
import { getTransactions, getTransactionById, createTransaction, getAccounts } from '../services/api';
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

function TxDetailModal({ txId, onClose }) {
  const { data, loading, error } = useApi(getTransactionById, txId, [txId]);
  const tx = data?.data;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-semibold">Transaction Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {tx && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-xs">Tx ID</p><p className="text-white font-mono">#{tx.transaction_id}</p></div>
                <div><p className="text-slate-500 text-xs">Amount</p><p className="text-white font-bold text-base">{formatCurrency(tx.amount)}</p></div>
                <div><p className="text-slate-500 text-xs">Customer</p><p className="text-white">{tx.full_name}</p></div>
                <div><p className="text-slate-500 text-xs">Account</p><p className="text-white font-mono text-xs">{tx.account_number}</p></div>
                <div><p className="text-slate-500 text-xs">Type</p><p className="text-slate-300">{tx.transaction_type}</p></div>
                <div><p className="text-slate-500 text-xs">Status</p><StatusBadge status={tx.transaction_status} /></div>
                <div><p className="text-slate-500 text-xs">Location</p><p className="text-slate-300">{tx.location || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Time</p><p className="text-slate-300 text-xs">{formatDate(tx.transaction_time)}</p></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs">Description</p><p className="text-slate-300">{tx.description || '—'}</p></div>
              </div>
              {tx.fraud_alerts?.length > 0 && (
                <div>
                  <p className="text-orange-400 text-xs uppercase font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Fraud Alerts ({tx.fraud_alerts.length})</p>
                  {tx.fraud_alerts.map(a => (
                    <div key={a.alert_id} className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-slate-400">{a.rule_name}</span><RiskScoreBadge score={a.risk_score} /></div>
                      <p className="text-slate-300">{a.fraud_reason}</p>
                      <StatusBadge status={a.alert_status} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateTxModal({ onClose, onSave }) {
  const [form, setForm] = useState({ account_id: '', amount: '', transaction_type: 'DEPOSIT', description: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { data: accData } = useApi(getAccounts, { limit: 100, status: 'ACTIVE' }, []);
  const accounts = accData?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account_id || !form.amount) { setError('Account and amount are required'); return; }
    setSaving(true); setError(null);
    try {
      const res = await onSave(form);
      setResult(res);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${result.data?.transaction_status === 'SUCCESS' ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
              {result.data?.transaction_status === 'SUCCESS' ? '✓' : '✗'}
            </div>
            <h3 className="text-white font-semibold">{result.message}</h3>
            <p className="text-slate-400 text-sm mt-1">Transaction #{result.data?.transaction_id}</p>
          </div>
          {result.fraudAlertsGenerated > 0 && (
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3 text-sm">
              <p className="text-orange-400 font-semibold">⚠ {result.fraudAlertsGenerated} Fraud Alert{result.fraudAlertsGenerated > 1 ? 's' : ''} Generated</p>
              <p className="text-slate-400 text-xs mt-1">Alert IDs: {result.fraudAlertIds.join(', ')}</p>
            </div>
          )}
          <button onClick={onClose} className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-white font-semibold">Simulate Transaction</h3>
            <p className="text-xs text-orange-400 mt-0.5">⚠ This is a simulated test transaction</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Account (Active) *</label>
            <select value={form.account_id} onChange={e => setForm(f => ({...f, account_id: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
              <option value="">Select account…</option>
              {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_number} — {a.full_name} (₹{parseFloat(a.balance).toLocaleString('en-IN')})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Type *</label>
            <select value={form.transaction_type} onChange={e => setForm(f => ({...f, transaction_type: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
          </div>
          <FormInput label="Amount (₹)" type="number" required min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="50000" />
          <FormInput label="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional description" />
          <FormInput label="Location" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Mumbai, MH" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Processing…' : 'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toasts, removeToast, toast } = useToast();

  const params = { search, type: typeFilter, status: statusFilter, dateFrom, dateTo, page, limit: 20 };
  const { data, loading, error, refetch } = useApi(getTransactions, params, [search, typeFilter, statusFilter, dateFrom, dateTo, page]);

  const txs = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  const handleSave = async (form) => {
    const res = await createTransaction(form);
    toast.success(res.data.message || 'Transaction created');
    refetch();
    return res.data;
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-xs"><SearchBar value={search} onChange={handleSearch} placeholder="Search…" /></div>
        <FilterDropdown value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} options={[{value:'DEPOSIT',label:'Deposit'},{value:'WITHDRAWAL',label:'Withdrawal'},{value:'TRANSFER',label:'Transfer'}]} placeholder="All Types" />
        <FilterDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{value:'SUCCESS',label:'Success'},{value:'FAILED',label:'Failed'},{value:'PENDING',label:'Pending'}]} placeholder="All Statuses" />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-2 py-2 bg-[#0f2040] border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-2 py-2 bg-[#0f2040] border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> Simulate Tx
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
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Account</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden lg:table-cell">Time</th>
                    <th className="px-4 py-3 text-slate-400 text-xs uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {txs.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState message="No transactions found" icon={ArrowLeftRight} /></td></tr>
                  ) : txs.map(tx => (
                    <tr key={tx.transaction_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">#{tx.transaction_id}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{tx.full_name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">{tx.account_number}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{tx.transaction_type}</span></td>
                      <td className="px-4 py-3 text-white font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={tx.transaction_status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(tx.transaction_time)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewId(tx.transaction_id)} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20">
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

      {viewId && <TxDetailModal txId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <CreateTxModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
    </div>
  );
}
