// server/config/db.js
// MySQL connection pool using mysql2/promise
const mysql = require('mysql2/promise');

let pool = null;

function createPool() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'banking_fraud_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30',
  });
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized. Call createPool() first.');
  return pool;
}

async function testConnection() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    const [[row]] = await conn.query('SELECT DATABASE() as db');
    const dbName = row.db;
    if (dbName !== process.env.DB_NAME) {
      throw new Error(`Connected to wrong database: ${dbName}. Expected: ${process.env.DB_NAME}`);
    }
    return dbName;
  } finally {
    conn.release();
  }
}

module.exports = { createPool, getPool, testConnection };
