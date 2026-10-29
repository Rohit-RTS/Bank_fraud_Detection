// server/server.js
// Application entry point
require('dotenv').config();

const { createPool, testConnection } = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Banking Fraud Detection System - Backend Starting...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize connection pool
  createPool();

  // Test database connection
  try {
    const dbName = await testConnection();
    console.log(`✅ MySQL connected → database: ${dbName}`);
  } catch (err) {
    console.error(`❌ MySQL connection failed: ${err.message}`);
    console.error('Please check your .env credentials and ensure MySQL is running.');
    process.exit(1);
  }

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   API base:     http://localhost:${PORT}/api`);
  });
}

startServer();
