const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { checkAuth } = require('../middleware/checkAuth');
const { checkRole } = require('../middleware/checkRole');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(checkAuth, checkRole('Admin'));

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
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
    body('name').optional().trim().notEmpty(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['Admin', 'Analyst', 'Viewer']),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validateRequest,
  userController.update
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid id'), validateRequest],
  userController.remove
);

module.exports = router;
