// server/routes/auditLogs.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditLogsController');
router.get('/', ctrl.getAuditLogs);
module.exports = router;
