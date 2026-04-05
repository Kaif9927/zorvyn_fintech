const express = require('express');
const { body, param, query } = require('express-validator');
const budgetController = require('../controllers/budgetController');
const { checkAuth } = require('../middleware/checkAuth');
const { checkRole } = require('../middleware/checkRole');
const { validateRequest } = require('../middleware/validateRequest');
const {
  requireYearMonthTogether,
  rejectNonAdminBudgetUserId,
} = require('../middleware/budgetQueryGuards');

const router = express.Router();

router.use(checkAuth);

const budgetQueryValidators = [
  requireYearMonthTogether,
  rejectNonAdminBudgetUserId,
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('year must be between 2000 and 2100')
    .toInt(),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('month must be between 1 and 12')
    .toInt(),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer')
    .toInt(),
  validateRequest,
];

// Analyst: read list + summary only. Mutations are Admin-only (full management).
router.get(
  '/summary',
  checkRole('Admin', 'Analyst'),
  ...budgetQueryValidators,
  budgetController.summary
);

router.get(
  '/',
  checkRole('Admin', 'Analyst'),
  ...budgetQueryValidators,
  budgetController.list
);

router.post(
  '/',
  checkRole('Admin'),
  [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be >= 0'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
    body('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('userId must be a positive integer'),
  ],
  validateRequest,
  budgetController.create
);

router.patch(
  '/:id',
  checkRole('Admin'),
  [
    param('id').isInt().withMessage('Invalid id'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount is required'),
  ],
  validateRequest,
  budgetController.update
);

router.delete(
  '/:id',
  checkRole('Admin'),
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  budgetController.remove
);

module.exports = router;
