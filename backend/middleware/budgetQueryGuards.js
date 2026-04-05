/**
 * Budget list/summary: year and month default in the service when both omitted;
 * supplying only one is ambiguous — reject.
 */
function requireYearMonthTogether(req, res, next) {
  const hasY = req.query.year != null && req.query.year !== '';
  const hasM = req.query.month != null && req.query.month !== '';
  if (hasY !== hasM) {
    return res.status(400).json({
      success: false,
      error:
        'Query parameters year and month must both be provided, or both omitted',
    });
  }
  next();
}

/** Non-admins cannot scope budgets to another user via query. */
function rejectNonAdminBudgetUserId(req, res, next) {
  if (
    req.user.role !== 'Admin' &&
    req.query.userId != null &&
    req.query.userId !== ''
  ) {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can filter budgets by userId',
    });
  }
  next();
}

module.exports = { requireYearMonthTogether, rejectNonAdminBudgetUserId };
