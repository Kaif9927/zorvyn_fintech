const express = require('express');
const { query } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const { checkAuth } = require('../middleware/checkAuth');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(checkAuth);

router.get('/summary', dashboardController.summary);

router.get('/category-summary', dashboardController.categorySummary);

router.get(
  '/recent-transactions',
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt(), validateRequest],
  dashboardController.recentTransactions
);

router.get(
  '/monthly-trends',
  [query('months').optional().isInt({ min: 1, max: 36 }).toInt(), validateRequest],
  dashboardController.monthlyTrends
);

router.get(
  '/weekly-trends',
  [query('weeks').optional().isInt({ min: 1, max: 52 }).toInt(), validateRequest],
  dashboardController.weeklyTrends
);

module.exports = router;
