// server/controllers/auditLogsController.js
// audit_logs actual columns: audit_id, entity_type, entity_id, action, details, risk_score, is_suspicious, fraud_reason, created_at
const { getPool } = require('../config/db');
const { getPagination, buildResponse } = require('../utils/queryHelpers');

async function getAuditLogs(req, res, next) {
  try {
    const pool = getPool();
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search || '';
    const entityType = req.query.entity_type || '';
    const action = req.query.action || '';
    const suspicious = req.query.suspicious;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(entity_type LIKE ? OR action LIKE ? OR CAST(audit_id AS CHAR) LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (entityType) {
      conditions.push(`entity_type = ?`);
      params.push(entityType);
    }
    if (action) {
      conditions.push(`action LIKE ?`);
      params.push(`%${action}%`);
    }
    if (suspicious === 'true') {
      conditions.push(`is_suspicious = 1`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT audit_id, entity_type, entity_id, action, details, risk_score, is_suspicious, fraud_reason, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get distinct entity types for filter dropdown
    const [entityTypes] = await pool.query(
      `SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type`
    );

    res.json({
      ...buildResponse(rows, total, page, limit),
      entityTypes: entityTypes.map(r => r.entity_type),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLogs };
