// client/src/layouts/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  ShieldAlert, Shield, Search, FileText, X, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/customers',     label: 'Customers',     icon: Users },
  { path: '/accounts',      label: 'Accounts',      icon: CreditCard },
  { path: '/transactions',  label: 'Transactions',  icon: ArrowLeftRight },
  { path: '/fraud-alerts',  label: 'Fraud Alerts',  icon: ShieldAlert },
  { path: '/fraud-rules',   label: 'Fraud Rules',   icon: Shield },
  { path: '/investigations',label: 'Investigations',icon: Search },
  { path: '/audit-logs',    label: 'Audit Logs',    icon: FileText },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-64
        bg-[#0a1628] border-r border-slate-800/60
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">FraudGuard</p>
              <p className="text-[10px] text-slate-500 leading-tight">Detection System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-600 text-center">DBMS Mini-Project · 2026</p>
        </div>
      </aside>
    </>
  );
}
