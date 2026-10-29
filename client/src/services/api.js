// client/src/services/api.js
// Centralized Axios API client

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for uniform error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// --- Health ---
export const checkHealth = () => api.get('/health');

// --- Dashboard ---
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDashboardCharts = () => api.get('/dashboard/charts');

// --- Customers ---
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);

// --- Accounts ---
export const getAccounts = (params) => api.get('/accounts', { params });
export const getAccountById = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts', data);
export const getAccountTransactions = (id, params) => api.get(`/accounts/${id}/transactions`, { params });

// --- Transactions ---
export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransactionById = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);

// --- Fraud Alerts ---
export const getFraudAlerts = (params) => api.get('/fraud-alerts', { params });
export const getFraudAlertById = (id) => api.get(`/fraud-alerts/${id}`);
export const updateAlertStatus = (id, status) => api.patch(`/fraud-alerts/${id}/status`, { status });

// --- Fraud Rules ---
export const getFraudRules = (params) => api.get('/fraud-rules', { params });
export const getFraudRuleById = (id) => api.get(`/fraud-rules/${id}`);
export const updateFraudRule = (id, data) => api.put(`/fraud-rules/${id}`, data);

// --- Investigations ---
export const getInvestigations = (params) => api.get('/investigations', { params });
export const getInvestigationById = (id) => api.get(`/investigations/${id}`);
export const createInvestigation = (data) => api.post('/investigations', data);
export const updateInvestigation = (id, data) => api.patch(`/investigations/${id}`, data);

// --- Audit Logs ---
export const getAuditLogs = (params) => api.get('/audit-logs', { params });

export default api;
