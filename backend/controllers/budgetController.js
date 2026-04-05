const { validationResult } = require('express-validator');
const budgetService = require('../services/budgetService');
const { asyncHandler } = require('../lib/asyncHandler');
const { AppError } = require('../lib/errors');

const list = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const data = await budgetService.listBudgets(req.query, req.user.id, req.user.role);
  res.json({ success: true, data });
});

const summary = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const year = req.query.year ? Number(req.query.year) : undefined;
  const month = req.query.month ? Number(req.query.month) : undefined;
  const data = await budgetService.summary(year, month, req.user.id, req.user.role, req.query);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const record = await budgetService.createBudget(
    {
      category: req.body.category,
      amount: req.body.amount,
      year: Number(req.body.year),
      month: Number(req.body.month),
      userId: req.body.userId,
    },
    req.user.id,
    req.user.role
  );
  res.status(201).json({ success: true, data: record });
});

const update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const record = await budgetService.updateBudget(
    req.params.id,
    { amount: req.body.amount },
    req.user.id,
    req.user.role
  );
  res.json({ success: true, data: record });
});

const remove = asyncHandler(async (req, res) => {
  await budgetService.removeBudget(req.params.id, req.user.id, req.user.role);
  res.json({ success: true, message: 'Budget removed' });
});

module.exports = { list, summary, create, update, remove };
