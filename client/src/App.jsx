// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import FraudAlerts from './pages/FraudAlerts';
import FraudRules from './pages/FraudRules';
import Investigations from './pages/Investigations';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="fraud-alerts" element={<FraudAlerts />} />
          <Route path="fraud-rules" element={<FraudRules />} />
          <Route path="investigations" element={<Investigations />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
