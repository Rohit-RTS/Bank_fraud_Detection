// server/controllers/accountsController.js
const { getPool } = require('../config/db');
const { getPagination, getSortOrder, buildResponse } = require('../utils/queryHelpers');

const VALID_TYPES = ['SAVINGS', 'CURRENT'];
const VALID_STATUSES = ['ACTIVE', 'FROZEN', 'CLOSED'];

async function getAccounts(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const { sortBy, sortOrder } = getSortOrder(req.query, 'accounts', 'account_id', 'ASC');
    const search = req.query.search || '';
    const accountType = req.query.type;
    const accountStatus = req.query.status;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(a.account_number LIKE ? OR c.full_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (accountType && VALID_TYPES.includes(accountType)) {
      conditions.push(`a.account_type = ?`);
      params.push(accountType);
    }
    if (accountStatus && VALID_STATUSES.includes(accountStatus)) {
      conditions.push(`a.account_status = ?`);
      params.push(accountStatus);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM accounts a JOIN customers c ON a.customer_id = c.customer_id ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT a.*, c.full_name, c.email
       FROM accounts a
       JOIN customers c ON a.customer_id = c.customer_id
       ${whereClause}
       ORDER BY a.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getAccountById(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[account]] = await pool.query(
      `SELECT a.*, c.full_name, c.email, c.phone
       FROM accounts a
       JOIN customers c ON a.customer_id = c.customer_id
       WHERE a.account_id = ?`, [id]
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
}

async function createAccount(req, res, next) {
  try {
    const pool = getPool();
    const { customer_id, account_number, account_type, initial_balance } = req.body;

    // Verify customer exists
    const [[customer]] = await pool.query(
      `SELECT customer_id FROM customers WHERE customer_id = ?`, [customer_id]
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Validate type
    if (!VALID_TYPES.includes(account_type)) {
      return res.status(400).json({ success: false, message: `Invalid account type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const balance = parseFloat(initial_balance) || 0;
    if (balance < 0) return res.status(400).json({ success: false, message: 'Initial balance cannot be negative' });

    const [result] = await pool.query(
      `INSERT INTO accounts (customer_id, account_number, account_type, balance) VALUES (?, ?, ?, ?)`,
      [customer_id, account_number, account_type, balance]
    );

    const [[newAccount]] = await pool.query(
      `SELECT a.*, c.full_name FROM accounts a JOIN customers c ON a.customer_id=c.customer_id WHERE a.account_id=?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Account created successfully', data: newAccount });
  } catch (err) {
    next(err);
  }
}

async function getAccountTransactions(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req.query);

    const [[account]] = await pool.query(
      `SELECT account_id FROM accounts WHERE account_id = ?`, [id]
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions WHERE account_id = ?`, [id]
    );

    const [rows] = await pool.query(
      `SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_time DESC LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

module.exports = { getAccounts, getAccountById, createAccount, getAccountTransactions };
