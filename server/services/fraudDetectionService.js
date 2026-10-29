// server/services/fraudDetectionService.js
// Rule-based fraud detection engine
const { getPool } = require('../config/db');

/**
 * Evaluate all active fraud rules for a newly created transaction.
 * Returns an array of generated alert IDs.
 */
async function evaluateFraudRules(transactionId, accountId, amount, transactionStatus, conn) {
  const db = conn || getPool();
  const generatedAlerts = [];

  // Fetch all active rules
  const [rules] = await db.query(
    `SELECT * FROM fraud_rules WHERE is_active = 1`
  );

  for (const rule of rules) {
    let triggered = false;
    let reason = '';

    // --- RULE TYPE DETECTION by rule_name ---
    const ruleName = (rule.rule_name || '').toUpperCase();

    // RULE 1: HIGH_VALUE_TRANSACTION
    if (ruleName.includes('HIGH_VALUE') || ruleName.includes('HIGH VALUE')) {
      if (rule.threshold_amount && amount > parseFloat(rule.threshold_amount)) {
        triggered = true;
        reason = `Transaction amount ₹${parseFloat(amount).toFixed(2)} exceeds high-value threshold of ₹${parseFloat(rule.threshold_amount).toFixed(2)}`;
      }
    }

    // RULE 2: TRANSACTION_VELOCITY
    else if (ruleName.includes('VELOCITY') || ruleName.includes('RAPID') || ruleName.includes('FREQUENCY')) {
      const count = rule.threshold_count || 5;
      const windowMinutes = rule.time_window_minutes || 60;
      const [[{ txCount }]] = await db.query(
        `SELECT COUNT(*) as txCount FROM transactions 
         WHERE account_id = ? AND transaction_time >= NOW() - INTERVAL ? MINUTE`,
        [accountId, windowMinutes]
      );
      if (txCount >= count) {
        triggered = true;
        reason = `Account made ${txCount} transactions within ${windowMinutes} minutes (threshold: ${count})`;
      }
    }

    // RULE 3: REPEATED_FAILED_TRANSACTIONS
    else if (ruleName.includes('FAILED') || ruleName.includes('FAIL')) {
      const count = rule.threshold_count || 3;
      const windowMinutes = rule.time_window_minutes || 30;
      const [[{ failCount }]] = await db.query(
        `SELECT COUNT(*) as failCount FROM transactions 
         WHERE account_id = ? AND transaction_status = 'FAILED' 
         AND transaction_time >= NOW() - INTERVAL ? MINUTE`,
        [accountId, windowMinutes]
      );
      if (failCount >= count) {
        triggered = true;
        reason = `Account had ${failCount} failed transactions within ${windowMinutes} minutes (threshold: ${count})`;
      }
    }

    // RULE 4: ANY rule with threshold_amount (generic high-value check)
    else if (rule.threshold_amount && !triggered) {
      if (amount > parseFloat(rule.threshold_amount)) {
        triggered = true;
        reason = `Transaction amount ₹${parseFloat(amount).toFixed(2)} triggered rule "${rule.rule_name}" (threshold: ₹${parseFloat(rule.threshold_amount).toFixed(2)})`;
      }
    }

    if (triggered) {
      // Check for duplicate alert (same transaction + rule)
      const [[existing]] = await db.query(
        `SELECT alert_id FROM fraud_alerts WHERE transaction_id = ? AND rule_id = ?`,
        [transactionId, rule.rule_id]
      );
      if (existing) {
        console.log(`[FRAUD] Duplicate alert skipped for tx=${transactionId} rule=${rule.rule_id}`);
        continue;
      }

      // Insert fraud alert
      const [result] = await db.query(
        `INSERT INTO fraud_alerts (transaction_id, rule_id, risk_score, fraud_reason, alert_status)
         VALUES (?, ?, ?, ?, 'OPEN')`,
        [transactionId, rule.rule_id, rule.risk_score, reason]
      );
      generatedAlerts.push(result.insertId);
      console.log(`[FRAUD] Alert generated: tx=${transactionId} rule=${rule.rule_name} alertId=${result.insertId}`);
    }
  }

  return generatedAlerts;
}

module.exports = { evaluateFraudRules };
