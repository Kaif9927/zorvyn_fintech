const { prisma } = require('../db');
const { AppError } = require('../lib/errors');
const { Prisma } = require('@prisma/client');

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function listBudgets(query, userId, role) {
  const targetUserId =
    role === 'Admin' && query.userId ? Number(query.userId) : userId;
  const year = query.year ? Number(query.year) : new Date().getFullYear();
  const month = query.month ? Number(query.month) : new Date().getMonth() + 1;

  const rows = await prisma.budget.findMany({
    where: {
      userId: targetUserId,
      year,
      month,
    },
    orderBy: { category: 'asc' },
  });

  return rows.map((b) => ({
    id: b.id,
    category: b.category,
    amount: b.amount.toString(),
    year: b.year,
    month: b.month,
    userId: b.userId,
  }));
}

async function summary(year, month, actorId, role, query) {
  const y = year ?? new Date().getFullYear();
  const m = month ?? new Date().getMonth() + 1;
  const targetUserId =
    role === 'Admin' && query?.userId != null ? Number(query.userId) : actorId;
  const { start, end } = monthRange(y, m);

  const budgets = await prisma.budget.findMany({
    where: { userId: targetUserId, year: y, month: m },
  });

  const lines = await Promise.all(
    budgets.map(async (b) => {
      const agg = await prisma.financialRecord.aggregate({
        where: {
          userId: targetUserId,
          is_deleted: false,
          type: 'expense',
          category: b.category,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      const spent = agg._sum.amount ?? new Prisma.Decimal(0);
      const cap = b.amount;
      const remaining = cap.sub(spent);
      return {
        category: b.category,
        budget: cap.toString(),
        spent: spent.toString(),
        remaining: remaining.toString(),
        over: spent.gt(cap),
      };
    })
  );

  return { year: y, month: m, lines };
}

async function createBudget(data, actorId, role) {
  const targetUserId =
    role === 'Admin' && data.userId != null ? Number(data.userId) : actorId;
  if (role !== 'Admin' && targetUserId !== actorId) {
    throw new AppError('You can only create budgets for yourself', 403);
  }

  const created = await prisma.budget.upsert({
    where: {
      userId_category_year_month: {
        userId: targetUserId,
        category: data.category.trim(),
        year: data.year,
        month: data.month,
      },
    },
    create: {
      userId: targetUserId,
      category: data.category.trim(),
      amount: new Prisma.Decimal(data.amount),
      year: data.year,
      month: data.month,
    },
    update: {
      amount: new Prisma.Decimal(data.amount),
    },
  });

  return {
    id: created.id,
    category: created.category,
    amount: created.amount.toString(),
    year: created.year,
    month: created.month,
    userId: created.userId,
  };
}

async function updateBudget(id, data, actorId, role) {
  const existing = await prisma.budget.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AppError('Budget not found', 404);
  if (role !== 'Admin' && existing.userId !== actorId) {
    throw new AppError('You can only edit your own budgets', 403);
  }

  const updateData = {};
  if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);

  const updated = await prisma.budget.update({
    where: { id: Number(id) },
    data: updateData,
  });
  return {
    id: updated.id,
    category: updated.category,
    amount: updated.amount.toString(),
    year: updated.year,
    month: updated.month,
    userId: updated.userId,
  };
}

async function removeBudget(id, actorId, role) {
  const existing = await prisma.budget.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AppError('Budget not found', 404);
  if (role !== 'Admin' && existing.userId !== actorId) {
    throw new AppError('You can only delete your own budgets', 403);
  }
  await prisma.budget.delete({ where: { id: Number(id) } });
}

module.exports = {
  listBudgets,
  summary,
  createBudget,
  updateBudget,
  removeBudget,
};
