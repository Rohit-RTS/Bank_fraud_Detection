// server/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health');
const dashboardRoutes = require('./routes/dashboard');
const customersRoutes = require('./routes/customers');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const fraudAlertsRoutes = require('./routes/fraudAlerts');
const fraudRulesRoutes = require('./routes/fraudRules');
const investigationsRoutes = require('./routes/investigations');
const auditLogsRoutes = require('./routes/auditLogs');

const app = express();

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/fraud-alerts', fraudAlertsRoutes);
app.use('/api/fraud-rules', fraudRulesRoutes);
app.use('/api/investigations', investigationsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
