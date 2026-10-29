// server/controllers/transactionsController.js
const { getPool } = require('../config/db');
const { getPagination, getSortOrder, buildResponse } = require('../utils/queryHelpers');
const { evaluateFraudRules } = require('../services/fraudDetectionService');

const VALID_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];
const VALID_STATUSES = ['PENDING', 'SUCCESS', 'FAILED'];

async function getTransactions(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const { sortBy, sortOrder } = getSortOrder(req.query, 'transactions', 'transaction_time', 'DESC');

    const conditions = [];
    const params = [];

    const search = req.query.search || '';
    if (search) {
      conditions.push(`(vtd.full_name LIKE ? OR vtd.account_number LIKE ? OR CAST(vtd.transaction_id AS CHAR) LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.type && VALID_TYPES.includes(req.query.type)) {
      conditions.push(`vtd.transaction_type = ?`);
      params.push(req.query.type);
    }
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      conditions.push(`vtd.transaction_status = ?`);
      params.push(req.query.status);
    }
    if (req.query.dateFrom) {
      conditions.push(`vtd.transaction_time >= ?`);
      params.push(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      conditions.push(`vtd.transaction_time <= ?`);
      params.push(req.query.dateTo + ' 23:59:59');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM vw_transaction_details vtd ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT * FROM vw_transaction_details vtd
       ${whereClause}
       ORDER BY vtd.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[tx]] = await pool.query(
      `SELECT * FROM vw_transaction_details WHERE transaction_id = ?`, [id]
    );
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Get related fraud alerts
    const [alerts] = await pool.query(
      `SELECT fa.*, fr.rule_name FROM fraud_alerts fa
       JOIN fraud_rules fr ON fa.rule_id = fr.rule_id
       WHERE fa.transaction_id = ?`, [id]
    );

    res.json({ success: true, data: { ...tx, fraud_alerts: alerts } });
  } catch (err) {
    next(err);
  }
}

async function createTransaction(req, res, next) {
  try {
    const pool = getPool();
    const { account_id, amount, transaction_type, description, location } = req.body;

    // Validate type
    if (!VALID_TYPES.includes(transaction_type)) {
      return res.status(400).json({ success: false, message: `Invalid transaction type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    // Verify account exists and is active
    const [[account]] = await pool.query(
      `SELECT account_id, account_status, balance FROM accounts WHERE account_id = ?`, [account_id]
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.account_status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `Account is ${account.account_status} and cannot process transactions` });
    }

    // Determine transaction status: simulate SUCCESS for deposits, check balance for withdrawals
    let transactionStatus = 'SUCCESS';
    if ((transaction_type === 'WITHDRAWAL' || transaction_type === 'TRANSFER') && parsedAmount > parseFloat(account.balance)) {
      transactionStatus = 'FAILED';
    }

    // Use a DB transaction for atomicity
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    let transactionId;
    let generatedAlerts = [];

    try {
      // Insert the transaction
      const [result] = await conn.query(
        `INSERT INTO transactions (account_id, amount, transaction_type, transaction_status, description, location)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [account_id, parsedAmount, transaction_type, transactionStatus, description || null, location || null]
      );
      transactionId = result.insertId;

      // Update account balance if SUCCESS
      if (transactionStatus === 'SUCCESS') {
        if (transaction_type === 'DEPOSIT') {
          await conn.query(`UPDATE accounts SET balance = balance + ? WHERE account_id = ?`, [parsedAmount, account_id]);
        } else {
          await conn.query(`UPDATE accounts SET balance = balance - ? WHERE account_id = ?`, [parsedAmount, account_id]);
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
    conn.release();

    // Evaluate fraud rules AFTER the transaction is committed
    try {
      generatedAlerts = await evaluateFraudRules(transactionId, account_id, parsedAmount, transactionStatus, pool);
    } catch (fraudErr) {
      console.error('[FRAUD ENGINE ERROR]', fraudErr.message);
    }

    // Fetch the created transaction with full details
    const [[tx]] = await pool.query(
      `SELECT * FROM vw_transaction_details WHERE transaction_id = ?`, [transactionId]
    );

    res.status(201).json({
      success: true,
      message: `Simulated transaction created with status: ${transactionStatus}`,
      data: tx,
      fraudAlertsGenerated: generatedAlerts.length,
      fraudAlertIds: generatedAlerts,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTransactions, getTransactionById, createTransaction };
