// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CreditCard, ArrowLeftRight, ShieldAlert,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardStats, getDashboardCharts } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import RiskScoreBadge from '../components/RiskScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/formatters';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS = { OPEN: '#3b82f6', UNDER_REVIEW: '#f59e0b', CONFIRMED: '#ef4444', FALSE_POSITIVE: '#6b7280', CLOSED: '#475569' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f2040] border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [statsRes, chartsRes] = await Promise.all([getDashboardStats(), getDashboardCharts()]);
      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!stats) return null;

  const alertStatusData = charts?.alertsByStatus?.map(r => ({
    name: r.status?.replace(/_/g, ' '),
    value: r.count,
    color: STATUS_COLORS[r.status] || '#6b7280',
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="blue" />
        <StatCard title="Total Accounts" value={stats.totalAccounts} icon={CreditCard} color="cyan" />
        <StatCard title="Transactions" value={stats.totalTransactions} icon={ArrowLeftRight} color="purple" sub={formatCurrency(stats.totalTransactionValue) + ' total'} />
        <StatCard title="Fraud Alerts" value={stats.totalFraudAlerts} icon={ShieldAlert} color="orange" sub={`${stats.openAlerts} open`} />
        <StatCard title="Confirmed Fraud" value={stats.confirmedFraud} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Successful Tx" value={stats.successfulTransactions} icon={CheckCircle} color="green" />
        <StatCard title="Failed Tx" value={stats.failedTransactions} icon={XCircle} color="red" />
        <StatCard title="Pending Tx" value={stats.pendingTransactions} icon={Clock} color="orange" />
        <StatCard title="High Risk Alerts" value={stats.highRiskAlerts} icon={TrendingUp} color="red" sub="Score ≥ 75" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction Volume Over Time */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Transaction Volume (Last 30 Days)</h3>
          {charts?.txVolume?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.txVolume}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorVolume)" name="Transactions" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-8">No transaction data in last 30 days</p>}
        </div>

        {/* Transaction Status */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Transaction Status Distribution</h3>
          {charts?.txStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.txStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {charts.txStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.status === 'SUCCESS' ? '#10b981' : entry.status === 'FAILED' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-8">No data</p>}
        </div>

        {/* Fraud Alerts by Status */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Fraud Alerts by Status</h3>
          {alertStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={alertStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {alertStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-8">No fraud alerts yet</p>}
        </div>

        {/* Risk Score Distribution */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Score Distribution</h3>
          {charts?.riskDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="risk_level" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Alerts" radius={[4, 4, 0, 0]}>
                  {charts.riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.risk_level?.includes('High') ? '#ef4444' : entry.risk_level?.includes('Medium') ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-8">No risk data</p>}
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-300">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {charts?.recentTransactions?.length > 0 ? (
            <div className="divide-y divide-slate-800/40">
              {charts.recentTransactions.map(tx => (
                <div key={tx.transaction_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{tx.full_name}</p>
                    <p className="text-xs text-slate-500">{tx.account_number} · {tx.transaction_type}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <StatusBadge status={tx.transaction_status} />
                    <span className="text-sm font-semibold text-white">{formatCurrency(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm text-center py-8">No recent transactions</p>}
        </div>

        {/* Recent Fraud Alerts */}
        <div className="bg-[#0a1628] border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-300">Latest Fraud Alerts</h3>
            <Link to="/fraud-alerts" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {charts?.recentAlerts?.length > 0 ? (
            <div className="divide-y divide-slate-800/40">
              {charts.recentAlerts.map(alert => (
                <div key={alert.alert_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{alert.rule_name}</p>
                    <p className="text-xs text-slate-500 truncate">{alert.fraud_reason}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <RiskScoreBadge score={alert.risk_score} />
                    <StatusBadge status={alert.alert_status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm text-center py-8">No fraud alerts</p>}
        </div>
      </div>
    </div>
  );
}
