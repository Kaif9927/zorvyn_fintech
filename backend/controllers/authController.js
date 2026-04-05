const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { asyncHandler } = require('../lib/asyncHandler');
const { AppError } = require('../lib/errors');

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const result = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, data: result });
});

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const user = await authService.registerUser(req.body, req.user?.role);
  res.status(201).json({ success: true, data: user });
});

const signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  const user = await authService.signupPublic({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.status(201).json({ success: true, data: user });
});

module.exports = { login, register, signup };
