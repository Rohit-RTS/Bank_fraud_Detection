// client/src/pages/Accounts.jsx
import { useState, useCallback } from 'react';
import { PlusCircle, Eye, CreditCard, X } from 'lucide-react';
import { getAccounts, getAccountById, createAccount, getCustomers } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';

function AccountDetailModal({ accountId, onClose }) {
  const { data, loading, error } = useApi(getAccountById, accountId, [accountId]);
  const account = data?.data;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">Account Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {account && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500 text-xs">Account ID</p><p className="text-white font-mono">#{account.account_id}</p></div>
              <div><p className="text-slate-500 text-xs">Account Number</p><p className="text-white font-mono">{account.account_number}</p></div>
              <div><p className="text-slate-500 text-xs">Customer</p><p className="text-white">{account.full_name}</p></div>
              <div><p className="text-slate-500 text-xs">Type</p><p className="text-white">{account.account_type}</p></div>
              <div><p className="text-slate-500 text-xs">Balance</p><p className="text-emerald-400 font-bold">{formatCurrency(account.balance)}</p></div>
              <div><p className="text-slate-500 text-xs">Status</p><StatusBadge status={account.account_status} /></div>
              <div className="col-span-2"><p className="text-slate-500 text-xs">Created</p><p className="text-slate-300">{formatDate(account.created_at)}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateAccountModal({ onClose, onSave }) {
  const [form, setForm] = useState({ customer_id: '', account_number: '', account_type: 'SAVINGS', initial_balance: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { data: custData } = useApi(getCustomers, { limit: 100 }, []);
  const customers = custData?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.account_number) { setError('Customer and account number are required'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">Create Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Customer *</label>
            <select value={form.customer_id} onChange={e => setForm(f => ({...f, customer_id: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name} (#{c.customer_id})</option>)}
            </select>
          </div>
          <FormInput label="Account Number" required value={form.account_number} onChange={e => setForm(f => ({...f, account_number: e.target.value}))} placeholder="ACC-001234" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Account Type *</label>
            <select value={form.account_type} onChange={e => setForm(f => ({...f, account_type: e.target.value}))} className="px-3 py-2 bg-[#0a1628] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500">
              <option value="SAVINGS">SAVINGS</option>
              <option value="CURRENT">CURRENT</option>
            </select>
          </div>
          <FormInput label="Initial Balance (₹)" type="number" min="0" step="0.01" value={form.initial_balance} onChange={e => setForm(f => ({...f, initial_balance: e.target.value}))} placeholder="0.00" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toasts, removeToast, toast } = useToast();

  const params = { search, type: typeFilter, status: statusFilter, page, limit: 15 };
  const { data, loading, error, refetch } = useApi(getAccounts, params, [search, typeFilter, statusFilter, page]);

  const accounts = data?.data || [];
  const pagination = data?.pagination;
  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  const handleSave = async (form) => {
    await createAccount(form);
    toast.success('Account created successfully');
    refetch();
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search account number or customer…" /></div>
        <FilterDropdown value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} options={[{value:'SAVINGS',label:'Savings'},{value:'CURRENT',label:'Current'}]} placeholder="All Types" />
        <FilterDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{value:'ACTIVE',label:'Active'},{value:'FROZEN',label:'Frozen'},{value:'CLOSED',label:'Closed'}]} placeholder="All Statuses" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> Add Account
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
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Account #</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Balance</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase hidden lg:table-cell">Created</th>
                    <th className="px-4 py-3 text-slate-400 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {accounts.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState message="No accounts found" icon={CreditCard} /></td></tr>
                  ) : accounts.map(a => (
                    <tr key={a.account_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-white font-mono text-xs">{a.account_number}</td>
                      <td className="px-4 py-3 text-slate-300">{a.full_name}</td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell"><span className="px-2 py-0.5 rounded bg-slate-800 text-xs">{a.account_type}</span></td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{formatCurrency(a.balance)}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.account_status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewId(a.account_id)} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20">
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

      {viewId && <AccountDetailModal accountId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
    </div>
  );
}
