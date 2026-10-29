// server/routes/transactions.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/transactionsController');

const txValidation = [
  body('account_id').isInt({ min: 1 }).withMessage('Valid account_id is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('transaction_type').isIn(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']).withMessage('Invalid transaction type'),
  body('description').optional().isLength({ max: 255 }),
  body('location').optional().isLength({ max: 100 }),
];

router.get('/', ctrl.getTransactions);
router.get('/:id', ctrl.getTransactionById);
router.post('/', txValidation, validate, ctrl.createTransaction);

module.exports = router;
