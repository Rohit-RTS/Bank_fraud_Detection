// server/controllers/fraudRulesController.js
const { getPool } = require('../config/db');
const { getPagination, buildResponse } = require('../utils/queryHelpers');

async function getFraudRules(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search || '';

    const whereClause = search ? `WHERE rule_name LIKE ? OR description LIKE ?` : '';
    const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM fraud_rules ${whereClause}`, searchParams
    );
    const [rows] = await pool.query(
      `SELECT * FROM fraud_rules ${whereClause} ORDER BY rule_id ASC LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getFraudRuleById(req, res, next) {
  try {
    const pool = getPool();
    const [[rule]] = await pool.query(
      `SELECT * FROM fraud_rules WHERE rule_id = ?`, [req.params.id]
    );
    if (!rule) return res.status(404).json({ success: false, message: 'Fraud rule not found' });

    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

async function updateFraudRule(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { description, threshold_amount, threshold_count, time_window_minutes, risk_score, is_active } = req.body;

    const [[existing]] = await pool.query(
      `SELECT * FROM fraud_rules WHERE rule_id = ?`, [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Fraud rule not found' });

    // Only allow specific fields to be updated
    const updates = {
      description: description !== undefined ? description : existing.description,
      threshold_amount: threshold_amount !== undefined ? (parseFloat(threshold_amount) || null) : existing.threshold_amount,
      threshold_count: threshold_count !== undefined ? (parseInt(threshold_count) || null) : existing.threshold_count,
      time_window_minutes: time_window_minutes !== undefined ? (parseInt(time_window_minutes) || null) : existing.time_window_minutes,
      risk_score: risk_score !== undefined ? Math.min(100, Math.max(0, parseInt(risk_score))) : existing.risk_score,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    };

    await pool.query(
      `UPDATE fraud_rules SET description=?, threshold_amount=?, threshold_count=?, time_window_minutes=?, risk_score=?, is_active=? WHERE rule_id=?`,
      [updates.description, updates.threshold_amount, updates.threshold_count, updates.time_window_minutes, updates.risk_score, updates.is_active, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM fraud_rules WHERE rule_id = ?`, [id]);
    res.json({ success: true, message: 'Fraud rule updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFraudRules, getFraudRuleById, updateFraudRule };
