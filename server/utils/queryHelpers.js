// server/utils/queryHelpers.js
// Safe pagination and sorting helpers

const ALLOWED_SORT_FIELDS = {
  transactions: ['transaction_id', 'amount', 'transaction_time', 'transaction_status', 'transaction_type'],
  fraud_alerts: ['alert_id', 'risk_score', 'created_at', 'alert_status'],
  customers: ['customer_id', 'full_name', 'email', 'created_at'],
  accounts: ['account_id', 'balance', 'created_at', 'account_type'],
  audit_logs: ['audit_id', 'created_at', 'entity_type', 'action'],
  investigations: ['investigation_id', 'created_at', 'investigation_status'],
  fraud_rules: ['rule_id', 'rule_name', 'risk_score', 'threshold_amount'],
};

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getSortOrder(query, table, defaultField = 'created_at', defaultOrder = 'DESC') {
  const allowed = ALLOWED_SORT_FIELDS[table] || [];
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : defaultOrder;
  return { sortBy, sortOrder };
}

function buildResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getPagination, getSortOrder, buildResponse };
