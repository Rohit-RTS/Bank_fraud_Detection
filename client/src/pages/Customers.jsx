// client/src/pages/Customers.jsx
import { useState, useCallback } from 'react';
import { UserPlus, Eye, Pencil, Users, X } from 'lucide-react';
import { getCustomers, getCustomerById, createCustomer, updateCustomer } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { formatDate } from '../utils/formatters';

const EMPTY_FORM = { full_name: '', email: '', phone: '', address: '' };

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(customer ? {
    full_name: customer.full_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) { setErrors({ submit: err.message }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormInput label="Full Name" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="John Doe" error={errors.full_name} />
          <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="john@example.com" error={errors.email} />
          <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98765 43210" />
          <FormInput label="Address" type="textarea" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="123 Main St, City" />
          {errors.submit && <p className="text-red-400 text-sm">{errors.submit}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : customer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerDetailModal({ customerId, onClose }) {
  const { data, loading, error } = useApi(getCustomerById, customerId, [customerId]);
  const customer = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f2040] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-semibold">Customer Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {customer && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-xs">ID</p><p className="text-white font-mono">#{customer.customer_id}</p></div>
                <div><p className="text-slate-500 text-xs">Name</p><p className="text-white">{customer.full_name}</p></div>
                <div><p className="text-slate-500 text-xs">Email</p><p className="text-slate-300">{customer.email || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Phone</p><p className="text-slate-300">{customer.phone || '—'}</p></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs">Address</p><p className="text-slate-300">{customer.address || '—'}</p></div>
                <div><p className="text-slate-500 text-xs">Joined</p><p className="text-slate-300">{formatDate(customer.created_at)}</p></div>
              </div>
              {customer.accounts?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs uppercase font-medium mb-2">Accounts ({customer.accounts.length})</p>
                  <div className="space-y-2">
                    {customer.accounts.map(acc => (
                      <div key={acc.account_id} className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm flex justify-between items-center">
                        <div>
                          <span className="text-white font-mono">{acc.account_number}</span>
                          <span className="text-slate-500 ml-2 text-xs">{acc.account_type}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-semibold text-xs">₹{parseFloat(acc.balance).toLocaleString('en-IN')}</p>
                          <p className={`text-xs ${acc.account_status === 'ACTIVE' ? 'text-emerald-400' : 'text-orange-400'}`}>{acc.account_status}</p>
                        </div>
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

export default function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | {type:'create'|'edit'|'view', data?}
  const { toasts, removeToast, toast } = useToast();

  const params = { search, page, limit: 15 };
  const { data, loading, error, refetch } = useApi(getCustomers, params, [search, page]);

  const customers = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);

  const handleSave = async (form) => {
    if (modal?.type === 'edit') {
      await updateCustomer(modal.data.customer_id, form);
      toast.success('Customer updated successfully');
    } else {
      await createCustomer(form);
      toast.success('Customer created successfully');
    }
    refetch();
  };

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 max-w-sm"><SearchBar value={search} onChange={handleSearch} placeholder="Search by name, email, phone…" /></div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl overflow-hidden">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/40">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase hidden lg:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase hidden lg:table-cell">Accounts</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase hidden xl:table-cell">Joined</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {customers.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState message="No customers found" icon={Users} /></td></tr>
                  ) : customers.map(c => (
                    <tr key={c.customer_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">#{c.customer_id}</td>
                      <td className="px-4 py-3 text-white font-medium">{c.full_name}</td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{c.account_count}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: 'view', data: c })} className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setModal({ type: 'edit', data: c })} className="p-1.5 rounded text-slate-400 hover:text-orange-400 hover:bg-orange-900/20 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Modals */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <CustomerModal
          customer={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === 'view' && (
        <CustomerDetailModal
          customerId={modal.data.customer_id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
