// server/routes/fraudRules.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fraudRulesController');

router.get('/', ctrl.getFraudRules);
router.get('/:id', ctrl.getFraudRuleById);
router.put('/:id', ctrl.updateFraudRule);

module.exports = router;
