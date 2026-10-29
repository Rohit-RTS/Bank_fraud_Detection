// server/routes/accounts.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/accountsController');

const accountValidation = [
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer_id is required'),
  body('account_number').trim().notEmpty().withMessage('Account number is required').isLength({ max: 30 }),
  body('account_type').isIn(['SAVINGS', 'CURRENT']).withMessage('Account type must be SAVINGS or CURRENT'),
  body('initial_balance').optional().isFloat({ min: 0 }).withMessage('Initial balance must be non-negative'),
];

router.get('/', ctrl.getAccounts);
router.get('/:id', ctrl.getAccountById);
router.post('/', accountValidation, validate, ctrl.createAccount);
router.get('/:id/transactions', ctrl.getAccountTransactions);

module.exports = router;
