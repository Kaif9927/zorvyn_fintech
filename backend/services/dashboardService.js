const { prisma } = require('../db');
const { Prisma } = require('@prisma/client');
const { decryptNoteField } = require('../lib/cryptoAtRest');

const recordFilter = (userId, role) => ({
  is_deleted: false,
  ...(role !== 'Admin' ? { userId } : {}),
});

async function getSummary(userId, role) {
  const where = recordFilter(userId, role);

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount || new Prisma.Decimal(0);
  const totalExpense = expenseAgg._sum.amount || new Prisma.Decimal(0);
  const net = totalIncome.minus(totalExpense);

  return {
    totalIncome: totalIncome.toString(),
    totalExpense: totalExpense.toString(),
    netBalance: net.toString(),
  };
}

async function getCategorySummary(userId, role) {
  const where = recordFilter(userId, role);

  const rows = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where,
    _sum: { amount: true },
  });

  return rows.map((r) => ({
    category: r.category,
    type: r.type,
    total: (r._sum.amount || new Prisma.Decimal(0)).toString(),
  }));
}

async function getRecentTransactions(userId, role, limit = 10) {
  const where = recordFilter(userId, role);
  const take = Math.min(Number(limit) || 10, 50);

  const rows = await prisma.financialRecord.findMany({
    where,
    take,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      note: true,
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    note: decryptNoteField(r.note),
  }));
}

/**
 * Monthly income vs expense for charts (last 12 months by default).
 */
async function getMonthlyTrends(userId, role, monthsBack = 12) {
  const where = recordFilter(userId, role);
  const since = new Date();
  since.setMonth(since.getMonth() - (Number(monthsBack) || 12));

  const records = await prisma.financialRecord.findMany({
    where: {
      ...where,
      date: { gte: since },
    },
    select: { amount: true, type: true, date: true },
  });

  const bucket = new Map();

  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!bucket.has(key)) {
      bucket.set(key, { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) });
    }
    const b = bucket.get(key);
    if (r.type === 'income') {
      b.income = b.income.plus(r.amount);
    } else {
      b.expense = b.expense.plus(r.amount);
    }
  }

  const sortedKeys = [...bucket.keys()].sort();
  return sortedKeys.map((month) => {
    const v = bucket.get(month);
    return {
      month,
      income: v.income.toString(),
      expense: v.expense.toString(),
    };
  });
}

/** Monday (local date) of the week containing `d`, as YYYY-MM-DD. */
function weekStartMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dn = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dn}`;
}

/**
 * Weekly income vs expense (buckets by week-start Monday).
 * Satisfies "monthly or weekly trends" from the assignment brief.
 */
async function getWeeklyTrends(userId, role, weeksBack = 12) {
  const where = recordFilter(userId, role);
  const since = new Date();
  since.setDate(since.getDate() - (Number(weeksBack) || 12) * 7);

  const records = await prisma.financialRecord.findMany({
    where: {
      ...where,
      date: { gte: since },
    },
    select: { amount: true, type: true, date: true },
  });

  const bucket = new Map();

  for (const r of records) {
    const key = weekStartMonday(r.date);
    if (!bucket.has(key)) {
      bucket.set(key, { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) });
    }
    const b = bucket.get(key);
    if (r.type === 'income') {
      b.income = b.income.plus(r.amount);
    } else {
      b.expense = b.expense.plus(r.amount);
    }
  }

  const sortedKeys = [...bucket.keys()].sort();
  return sortedKeys.map((weekStart) => {
    const v = bucket.get(weekStart);
    return {
      weekStart,
      income: v.income.toString(),
      expense: v.expense.toString(),
    };
  });
}

module.exports = {
  getSummary,
  getCategorySummary,
  getRecentTransactions,
  getMonthlyTrends,
  getWeeklyTrends,
};
