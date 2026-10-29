// server/controllers/fraudAlertsController.js
const { getPool } = require('../config/db');
const { getPagination, getSortOrder, buildResponse } = require('../utils/queryHelpers');

const VALID_STATUSES = ['OPEN', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'];

async function getFraudAlerts(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const { sortBy, sortOrder } = getSortOrder(req.query, 'fraud_alerts', 'created_at', 'DESC');

    const conditions = [];
    const params = [];

    const search = req.query.search || '';
    if (search) {
      conditions.push(`(vfad.full_name LIKE ? OR CAST(vfad.alert_id AS CHAR) LIKE ? OR CAST(vfad.transaction_id AS CHAR) LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      conditions.push(`vfad.alert_status = ?`);
      params.push(req.query.status);
    }
    if (req.query.minRisk) {
      conditions.push(`vfad.risk_score >= ?`);
      params.push(parseInt(req.query.minRisk));
    }
    if (req.query.maxRisk) {
      conditions.push(`vfad.risk_score <= ?`);
      params.push(parseInt(req.query.maxRisk));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM vw_fraud_alert_details vfad ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT vfad.*, fa.rule_id, fa.updated_at
       FROM vw_fraud_alert_details vfad
       JOIN fraud_alerts fa ON vfad.alert_id = fa.alert_id
       ${whereClause}
       ORDER BY vfad.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getFraudAlertById(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[alert]] = await pool.query(
      `SELECT fa.*, fr.rule_name, fr.description as rule_description, fr.threshold_amount,
              c.full_name, a.account_number, t.amount, t.transaction_type, t.transaction_time
       FROM fraud_alerts fa
       JOIN fraud_rules fr ON fa.rule_id = fr.rule_id
       JOIN transactions t ON fa.transaction_id = t.transaction_id
       JOIN accounts a ON t.account_id = a.account_id
       JOIN customers c ON a.customer_id = c.customer_id
       WHERE fa.alert_id = ?`, [id]
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Fraud alert not found' });

    // Get associated investigation if any
    const [[investigation]] = await pool.query(
      `SELECT * FROM investigations WHERE alert_id = ?`, [id]
    );

    // Get audit logs for this alert
    const [auditLogs] = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type = 'FRAUD_ALERTS' AND entity_id = ?
       ORDER BY created_at DESC LIMIT 20`, [id]
    );

    res.json({ success: true, data: { ...alert, investigation, auditLogs } });
  } catch (err) {
    next(err);
  }
}

async function updateAlertStatus(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const [[existing]] = await pool.query(
      `SELECT alert_id FROM fraud_alerts WHERE alert_id = ?`, [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Fraud alert not found' });

    await pool.query(
      `UPDATE fraud_alerts SET alert_status = ?, updated_at = NOW() WHERE alert_id = ?`,
      [status, id]
    );

    const [[updated]] = await pool.query(
      `SELECT * FROM fraud_alerts WHERE alert_id = ?`, [id]
    );

    res.json({ success: true, message: 'Alert status updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFraudAlerts, getFraudAlertById, updateAlertStatus };
