// server/routes/investigations.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/investigationsController');

const invValidation = [
  body('alert_id').isInt({ min: 1 }).withMessage('Valid alert_id is required'),
  body('investigator_name').optional().isLength({ max: 100 }),
  body('investigation_notes').optional(),
];

router.get('/', ctrl.getInvestigations);
router.get('/:id', ctrl.getInvestigationById);
router.post('/', invValidation, validate, ctrl.createInvestigation);
router.patch('/:id', ctrl.updateInvestigation);

module.exports = router;
