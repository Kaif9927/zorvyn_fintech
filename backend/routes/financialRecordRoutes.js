const express = require('express');
const { body, param, query } = require('express-validator');
const financialRecordController = require('../controllers/financialRecordController');
const { checkAuth } = require('../middleware/checkAuth');
const { checkRole } = require('../middleware/checkRole');
const { validateRequest } = require('../middleware/validateRequest');
const {
  requireAtLeastOneBodyField,
} = require('../middleware/requireAtLeastOneBodyField');

const router = express.Router();

router.use(checkAuth);

const listValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date'),
  query('category').optional().trim(),
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('type must be income or expense'),
  query('search').optional().trim(),
];

router.get(
  '/',
  checkRole('Admin', 'Analyst'),
  listValidators,
  validateRequest,
  financialRecordController.list
);

router.get(
  '/:id',
  checkRole('Admin', 'Analyst'),
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  financialRecordController.getOne
);

router.post(
  '/',
  checkRole('Admin'),
  [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('note').optional().trim(),
    body('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('userId must be a positive integer'),
  ],
  validateRequest,
  financialRecordController.create
);

router.patch(
  '/:id',
  checkRole('Admin'),
  [
    param('id').isInt().withMessage('Invalid id'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('type')
      .optional()
      .isIn(['income', 'expense'])
      .withMessage('Type must be income or expense'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Valid date is required'),
    body('note').optional().trim(),
  ],
  validateRequest,
  requireAtLeastOneBodyField(['amount', 'type', 'category', 'date', 'note']),
  financialRecordController.update
);

router.delete(
  '/:id',
  checkRole('Admin'),
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  financialRecordController.remove
);

module.exports = router;
