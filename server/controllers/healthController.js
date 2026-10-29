// server/controllers/healthController.js
const { getPool } = require('../config/db');

async function getHealth(req, res, next) {
  try {
    const pool = getPool();
    const [[row]] = await pool.query('SELECT DATABASE() as db, NOW() as serverTime');
    res.json({
      success: true,
      message: 'Backend and MySQL connection successful',
      database: row.db,
      databaseConnected: true,
      serverTime: row.serverTime,
      environment: process.env.NODE_ENV,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      databaseConnected: false,
      error: err.message,
    });
  }
}

module.exports = { getHealth };
