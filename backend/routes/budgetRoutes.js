const express = require('express');
const { body, param, query } = require('express-validator');
const budgetController = require('../controllers/budgetController');
const { checkAuth } = require('../middleware/checkAuth');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(checkAuth);

router.get(
  '/summary',
  [
    query('year').optional().isInt({ min: 2000, max: 2100 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('userId').optional().isInt(),
  ],
  validateRequest,
  budgetController.summary
);

router.get(
  '/',
  [
    query('year').optional().isInt({ min: 2000, max: 2100 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('userId').optional().isInt(),
  ],
  validateRequest,
  budgetController.list
);

router.post(
  '/',
  [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be >= 0'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
    body('userId').optional().isInt(),
  ],
  validateRequest,
  budgetController.create
);

router.patch(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid id'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount is required'),
  ],
  validateRequest,
  budgetController.update
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  budgetController.remove
);

module.exports = router;
