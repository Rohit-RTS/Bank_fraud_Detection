// server/controllers/investigationsController.js
const { getPool } = require('../config/db');
const { getPagination, getSortOrder, buildResponse } = require('../utils/queryHelpers');

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

async function getInvestigations(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const { sortBy, sortOrder } = getSortOrder(req.query, 'investigations', 'created_at', 'DESC');
    const search = req.query.search || '';
    const status = req.query.status;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(i.investigator_name LIKE ? OR CAST(i.investigation_id AS CHAR) LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(`i.investigation_status = ?`);
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM investigations i ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT i.*, fa.risk_score, fa.fraud_reason, fa.alert_status, fa.transaction_id,
              vfad.full_name, vfad.account_number, vfad.amount, vfad.rule_name
       FROM investigations i
       JOIN fraud_alerts fa ON i.alert_id = fa.alert_id
       LEFT JOIN vw_fraud_alert_details vfad ON i.alert_id = vfad.alert_id
       ${whereClause}
       ORDER BY i.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(buildResponse(rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getInvestigationById(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[inv]] = await pool.query(
      `SELECT i.*, fa.risk_score, fa.fraud_reason, fa.alert_status, fa.transaction_id,
              vfad.full_name, vfad.account_number, vfad.amount, vfad.rule_name
       FROM investigations i
       JOIN fraud_alerts fa ON i.alert_id = fa.alert_id
       LEFT JOIN vw_fraud_alert_details vfad ON i.alert_id = vfad.alert_id
       WHERE i.investigation_id = ?`, [id]
    );
    if (!inv) return res.status(404).json({ success: false, message: 'Investigation not found' });

    res.json({ success: true, data: inv });
  } catch (err) {
    next(err);
  }
}

async function createInvestigation(req, res, next) {
  try {
    const pool = getPool();
    const { alert_id, investigator_name, investigation_notes, resolution } = req.body;

    // Verify alert exists
    const [[alert]] = await pool.query(
      `SELECT alert_id FROM fraud_alerts WHERE alert_id = ?`, [alert_id]
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Fraud alert not found' });

    // Check no existing investigation for this alert (unique constraint)
    const [[existing]] = await pool.query(
      `SELECT investigation_id FROM investigations WHERE alert_id = ?`, [alert_id]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: 'An investigation already exists for this alert' });
    }

    const [result] = await pool.query(
      `INSERT INTO investigations (alert_id, investigator_name, investigation_notes, resolution)
       VALUES (?, ?, ?, ?)`,
      [alert_id, investigator_name || null, investigation_notes || null, resolution || null]
    );

    const [[newInv]] = await pool.query(
      `SELECT * FROM investigations WHERE investigation_id = ?`, [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Investigation created successfully', data: newInv });
  } catch (err) {
    next(err);
  }
}

async function updateInvestigation(req, res, next) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { investigator_name, investigation_notes, investigation_status, resolution } = req.body;

    const [[existing]] = await pool.query(
      `SELECT * FROM investigations WHERE investigation_id = ?`, [id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Investigation not found' });

    if (investigation_status && !VALID_STATUSES.includes(investigation_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    await pool.query(
      `UPDATE investigations SET
        investigator_name = ?,
        investigation_notes = ?,
        investigation_status = ?,
        resolution = ?,
        updated_at = NOW()
       WHERE investigation_id = ?`,
      [
        investigator_name !== undefined ? investigator_name : existing.investigator_name,
        investigation_notes !== undefined ? investigation_notes : existing.investigation_notes,
        investigation_status || existing.investigation_status,
        resolution !== undefined ? resolution : existing.resolution,
        id,
      ]
    );

    const [[updated]] = await pool.query(`SELECT * FROM investigations WHERE investigation_id=?`, [id]);
    res.json({ success: true, message: 'Investigation updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInvestigations, getInvestigationById, createInvestigation, updateInvestigation };
