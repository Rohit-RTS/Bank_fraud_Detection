// server/controllers/customersController.js
const { getPool } = require('../config/db');
const { getPagination, getSortOrder, buildResponse } = require('../utils/queryHelpers');

async function getCustomers(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const { sortBy, sortOrder } = getSortOrder(req.query, 'customers', 'customer_id', 'ASC');
    const search = req.query.search || '';

    const searchParam = `%${search}%`;
    const whereClause = search
      ? `WHERE c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR CAST(c.customer_id AS CHAR) LIKE ?`
      : '';
    const searchParams = search ? [searchParam, searchParam, searchParam, searchParam] : [];

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
      searchParams
    );

    const [rows] = await pool.query(
      `SELECT c.customer_id, c.full_name, c.email, c.phone, c.address, c.created_at,
              COUNT(a.account_id) as account_count
       FROM customers c
       LEFT JOIN accounts a ON c.customer_id = a.customer_id
       ${whereClause}
       GROUP BY c.customer_id
       ORDER BY c.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[customer]] = await pool.query(
      `SELECT * FROM customers WHERE customer_id = ?`, [id]
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const [accounts] = await pool.query(
      `SELECT * FROM accounts WHERE customer_id = ?`, [id]
    );

    res.json({ success: true, data: { ...customer, accounts } });
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const pool = getPool();
    const { full_name, email, phone, address } = req.body;

    const [result] = await pool.query(
      `INSERT INTO customers (full_name, email, phone, address) VALUES (?, ?, ?, ?)`,
      [full_name, email || null, phone || null, address || null]
    );

    const [[newCustomer]] = await pool.query(
      `SELECT * FROM customers WHERE customer_id = ?`, [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Customer created successfully', data: newCustomer });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { full_name, email, phone, address } = req.body;

    const [[existing]] = await pool.query(
      `SELECT customer_id FROM customers WHERE customer_id = ?`, [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Customer not found' });

    await pool.query(
      `UPDATE customers SET full_name=?, email=?, phone=?, address=? WHERE customer_id=?`,
      [full_name, email || null, phone || null, address || null, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM customers WHERE customer_id=?`, [id]);
    res.json({ success: true, message: 'Customer updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer };
