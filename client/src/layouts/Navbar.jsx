// client/src/layouts/Navbar.jsx
import { Menu, Bell, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard':      'Dashboard',
  '/customers':      'Customers',
  '/accounts':       'Accounts',
  '/transactions':   'Transactions',
  '/fraud-alerts':   'Fraud Alerts',
  '/fraud-rules':    'Fraud Rules',
  '/investigations': 'Investigations',
  '/audit-logs':     'Audit Logs',
};

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] || 'FraudGuard';

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-4 lg:px-6 h-14 bg-[#050d1a]/90 backdrop-blur border-b border-slate-800/60">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold text-white flex-1">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/40 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:block text-xs text-slate-400">Admin</span>
        </div>
      </div>
    </header>
  );
}
