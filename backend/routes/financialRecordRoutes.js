const express = require('express');
const { body, param, query } = require('express-validator');
const financialRecordController = require('../controllers/financialRecordController');
const { checkAuth } = require('../middleware/checkAuth');
const { checkRole } = require('../middleware/checkRole');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(checkAuth);

const listValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('category').optional().trim(),
  query('type').optional().isIn(['income', 'expense']),
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
    body('userId').optional().isInt().withMessage('userId must be an integer'),
  ],
  validateRequest,
  financialRecordController.create
);

router.patch(
  '/:id',
  checkRole('Admin'),
  [
    param('id').isInt().withMessage('Invalid id'),
    body('amount').optional().isFloat({ min: 0 }),
    body('type').optional().isIn(['income', 'expense']),
    body('category').optional().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('note').optional().trim(),
  ],
  validateRequest,
  financialRecordController.update
);

router.delete(
  '/:id',
  checkRole('Admin'),
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  financialRecordController.remove
);

module.exports = router;
