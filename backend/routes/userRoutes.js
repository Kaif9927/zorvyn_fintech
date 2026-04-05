const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { checkAuth } = require('../middleware/checkAuth');
const { checkRole } = require('../middleware/checkRole');
const { validateRequest } = require('../middleware/validateRequest');
const {
  requireAtLeastOneBodyField,
} = require('../middleware/requireAtLeastOneBodyField');

const router = express.Router();

router.use(checkAuth, checkRole('Admin'));

router.get(
  '/',
  [
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
    query('search').optional().trim(),
  ],
  validateRequest,
  userController.list
);

router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  userController.getOne
);

router.patch(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid id'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['Admin', 'Analyst', 'Viewer'])
      .withMessage('role must be Admin, Analyst, or Viewer'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('status must be active or inactive'),
  ],
  validateRequest,
  requireAtLeastOneBodyField(['name', 'password', 'role', 'status']),
  userController.update
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  userController.remove
);

module.exports = router;
