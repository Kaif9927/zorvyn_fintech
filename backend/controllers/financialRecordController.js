const { validationResult } = require('express-validator');
const financialRecordService = require('../services/financialRecordService');
const { asyncHandler } = require('../lib/asyncHandler');
const { AppError } = require('../lib/errors');

const list = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const data = await financialRecordService.listRecords(
    req.query,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const record = await financialRecordService.getRecordById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, data: record });
});

const create = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const targetUserId = req.body.userId ? Number(req.body.userId) : req.user.id;
  if (req.user.role !== 'Admin' && targetUserId !== req.user.id) {
    throw new AppError('You can only create records for yourself', 403);
  }
  const record = await financialRecordService.createRecord(
    {
      amount: req.body.amount,
      type: req.body.type,
      category: req.body.category,
      date: req.body.date,
      note: req.body.note,
    },
    targetUserId
  );
  res.status(201).json({ success: true, data: record });
});

const update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const record = await financialRecordService.updateRecord(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, data: record });
});

const remove = asyncHandler(async (req, res) => {
  await financialRecordService.softDeleteRecord(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, message: 'Record removed' });
});

module.exports = { list, getOne, create, update, remove };
