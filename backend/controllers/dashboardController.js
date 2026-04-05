const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../lib/asyncHandler');

const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user.id, req.user.role);
  res.json({ success: true, data });
});

const categorySummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategorySummary(req.user.id, req.user.role);
  res.json({ success: true, data });
});

const recentTransactions = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 10;
  const data = await dashboardService.getRecentTransactions(
    req.user.id,
    req.user.role,
    limit
  );
  res.json({ success: true, data });
});

const monthlyTrends = asyncHandler(async (req, res) => {
  const months = req.query.months || 12;
  const data = await dashboardService.getMonthlyTrends(
    req.user.id,
    req.user.role,
    months
  );
  res.json({ success: true, data });
});

const weeklyTrends = asyncHandler(async (req, res) => {
  const weeks = req.query.weeks || 12;
  const data = await dashboardService.getWeeklyTrends(
    req.user.id,
    req.user.role,
    weeks
  );
  res.json({ success: true, data });
});

module.exports = {
  summary,
  categorySummary,
  recentTransactions,
  monthlyTrends,
  weeklyTrends,
};
