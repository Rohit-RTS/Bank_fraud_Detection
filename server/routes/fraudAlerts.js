// server/routes/fraudAlerts.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/fraudAlertsController');

router.get('/', ctrl.getFraudAlerts);
router.get('/:id', ctrl.getFraudAlertById);
router.patch('/:id/status',
  [body('status').isIn(['OPEN', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED']).withMessage('Invalid status')],
  validate,
  ctrl.updateAlertStatus
);

module.exports = router;
