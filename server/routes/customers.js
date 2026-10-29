// server/routes/customers.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/customersController');

const customerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email format').isLength({ max: 150 }),
  body('phone').optional({ nullable: true }).isLength({ max: 15 }),
  body('address').optional({ nullable: true }).isLength({ max: 255 }),
];

router.get('/', ctrl.getCustomers);
router.get('/:id', ctrl.getCustomerById);
router.post('/', customerValidation, validate, ctrl.createCustomer);
router.put('/:id', customerValidation, validate, ctrl.updateCustomer);

module.exports = router;
