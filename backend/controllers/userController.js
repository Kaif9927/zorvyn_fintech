const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const { asyncHandler } = require('../lib/asyncHandler');
const { AppError } = require('../lib/errors');

const list = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const data = await userService.listUsers(req.query);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

const update = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const user = await userService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
});

const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { list, getOne, update, remove };
