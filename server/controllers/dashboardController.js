// server/controllers/dashboardController.js
const { getPool } = require('../config/db');

async function getStats(req, res, next) {
  try {
    const pool = getPool();

    // Run all stats queries in parallel
    const [
      [[totalCustomers]],
      [[totalAccounts]],
      [[txStats]],
      [[alertStats]],
      [[totalValue]],
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM customers'),
      pool.query('SELECT COUNT(*) as total FROM accounts'),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN transaction_status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN transaction_status = 'PENDING' THEN 1 ELSE 0 END) as pending
        FROM transactions
      `),
      pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN alert_status = 'OPEN' THEN 1 ELSE 0 END) as open_alerts,
          SUM(CASE WHEN alert_status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN alert_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review,
          SUM(CASE WHEN alert_status = 'FALSE_POSITIVE' THEN 1 ELSE 0 END) as false_positive,
          SUM(CASE WHEN alert_status = 'CLOSED' THEN 1 ELSE 0 END) as closed
        FROM fraud_alerts
      `),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total_value FROM transactions WHERE transaction_status = 'SUCCESS'`),
    ]);

    // High risk = risk_score >= 75
    const [[highRisk]] = await pool.query(
      `SELECT COUNT(*) as total FROM fraud_alerts WHERE risk_score >= 75`
    );

    res.json({
      success: true,
      data: {
        totalCustomers: totalCustomers.total,
        totalAccounts: totalAccounts.total,
        totalTransactions: txStats.total,
        successfulTransactions: txStats.successful,
        failedTransactions: txStats.failed,
        pendingTransactions: txStats.pending,
        totalTransactionValue: parseFloat(totalValue.total_value),
        totalFraudAlerts: alertStats.total,
        openAlerts: alertStats.open_alerts,
        confirmedFraud: alertStats.confirmed,
        underReviewAlerts: alertStats.under_review,
        falsePositives: alertStats.false_positive,
        closedAlerts: alertStats.closed,
        highRiskAlerts: highRisk.total,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getCharts(req, res, next) {
  try {
    const pool = getPool();

    // Transaction volume over last 30 days (grouped by date)
    const [txVolume] = await pool.query(`
      SELECT 
        DATE(transaction_time) as date,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as volume
      FROM transactions
      WHERE transaction_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(transaction_time)
      ORDER BY date ASC
    `);

    // Transaction status distribution
    const [txStatus] = await pool.query(`
      SELECT transaction_status as status, COUNT(*) as count
      FROM transactions
      GROUP BY transaction_status
    `);

    // Fraud alerts by status
    const [alertsByStatus] = await pool.query(`
      SELECT alert_status as status, COUNT(*) as count
      FROM fraud_alerts
      GROUP BY alert_status
    `);

    // Risk score distribution (buckets: Low 0-39, Medium 40-74, High 75-100)
    const [riskDistribution] = await pool.query(`
      SELECT
        CASE 
          WHEN risk_score < 40 THEN 'Low (0-39)'
          WHEN risk_score < 75 THEN 'Medium (40-74)'
          ELSE 'High (75-100)'
        END as risk_level,
        COUNT(*) as count
      FROM fraud_alerts
      GROUP BY risk_level
    `);

    // Transaction type distribution
    const [txTypes] = await pool.query(`
      SELECT transaction_type as type, COUNT(*) as count, COALESCE(SUM(amount),0) as total_amount
      FROM transactions
      GROUP BY transaction_type
    `);

    // Recent transactions (last 5)
    const [recentTransactions] = await pool.query(`
      SELECT t.transaction_id, c.full_name, a.account_number, t.amount,
             t.transaction_type, t.transaction_status, t.transaction_time
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      JOIN customers c ON a.customer_id = c.customer_id
      ORDER BY t.transaction_time DESC
      LIMIT 5
    `);

    // Latest fraud alerts (last 5)
    const [recentAlerts] = await pool.query(`
      SELECT alert_id, transaction_id, rule_name, risk_score, fraud_reason, alert_status, created_at
      FROM vw_fraud_alert_details
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        txVolume,
        txStatus,
        alertsByStatus,
        riskDistribution,
        txTypes,
        recentTransactions,
        recentAlerts,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getCharts };
