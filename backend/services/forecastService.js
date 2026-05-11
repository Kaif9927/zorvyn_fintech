/**
 * Forecast service — predicts next month's total expense using
 * ordinary-least-squares linear regression on monthly expense totals.
 *
 *   y_i = slope * x_i + intercept,   x_i in {0,1,...,n-1}
 *   prediction for next month: y_hat(n) = slope * n + intercept
 */
const { prisma } = require('../db');
const { Prisma } = require('@prisma/client');

const recordFilter = (userId, role) => ({
  is_deleted: false,
  type: 'expense',
  ...(role !== 'Admin' ? { userId } : {}),
});

/** Format a Date as 'YYYY-MM'. */
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Next calendar month from (year, monthIdx0..11) as 'YYYY-MM'. */
function nextMonthKey(year, monthIdx) {
  const y = monthIdx === 11 ? year + 1 : year;
  const m = monthIdx === 11 ? 0 : monthIdx + 1;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

/**
 * Build a continuous sequence of monthly expense totals for the last
 * `monthsBack` calendar months (oldest -> newest), filling zero for
 * months with no recorded expenses.
 */
async function getMonthlyExpenseSeries(userId, role, monthsBack) {
  const where = recordFilter(userId, role);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const records = await prisma.financialRecord.findMany({
    where: { ...where, date: { gte: start } },
    select: { amount: true, date: true },
  });

  const bucket = new Map();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    bucket.set(monthKey(d), new Prisma.Decimal(0));
  }
  for (const r of records) {
    const k = monthKey(new Date(r.date));
    if (bucket.has(k)) bucket.set(k, bucket.get(k).plus(r.amount));
  }

  return [...bucket.entries()].map(([month, total]) => ({
    month,
    expense: Number(total.toString()),
  }));
}

/**
 * Ordinary least squares linear regression on (x, y) where x is the
 * 0-based month index. Returns slope, intercept, and the coefficient
 * of determination R^2.
 */
function fitLinearRegression(series) {
  const n = series.length;
  if (n < 2) return null;

  const xs = series.map((_, i) => i);
  const ys = series.map((s) => s.expense);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let sxy = 0;
  let sxx = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    sst += dy * dy;
  }
  if (sxx === 0) return null;

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;

  let ssr = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssr += (ys[i] - pred) ** 2;
  }
  const r2 = sst === 0 ? 1 : 1 - ssr / sst;

  return { slope, intercept, r2 };
}

/**
 * Predict next month's total expense.
 *  - monthsBack: how many past months to use as training data (default 6, max 24)
 *  - returns { history, prediction: { month, expense }, model, sampleSize, method }
 */
async function predictNextMonthExpense(userId, role, monthsBack = 6) {
  const n = Math.min(Math.max(Number(monthsBack) || 6, 2), 24);
  const history = await getMonthlyExpenseSeries(userId, role, n);

  const fit = fitLinearRegression(history);
  const now = new Date();
  const nextMonth = nextMonthKey(now.getFullYear(), now.getMonth());

  if (!fit) {
    const fallback = history.length ? history[history.length - 1].expense : 0;
    return {
      history,
      prediction: { month: nextMonth, expense: Math.max(0, fallback).toFixed(2) },
      model: null,
      sampleSize: history.length,
      method: 'fallback-last-month',
    };
  }

  const rawPredicted = fit.slope * n + fit.intercept;
  const predicted = Math.max(0, rawPredicted);

  return {
    history,
    prediction: {
      month: nextMonth,
      expense: predicted.toFixed(2),
    },
    model: {
      slope: Number(fit.slope.toFixed(4)),
      intercept: Number(fit.intercept.toFixed(4)),
      r2: Number(fit.r2.toFixed(4)),
      equation: `y = ${fit.slope.toFixed(2)} * x + ${fit.intercept.toFixed(2)}`,
    },
    sampleSize: n,
    method: 'linear-regression',
  };
}

module.exports = { predictNextMonthExpense };
