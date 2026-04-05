const authService = require('../services/authService');
const { asyncHandler } = require('../lib/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, data: result });
});

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body, req.user?.role);
  res.status(201).json({ success: true, data: user });
});

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signupPublic({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.status(201).json({ success: true, data: user });
});

const bootstrapStatus = asyncHandler(async (req, res) => {
  const allowed = await authService.isBootstrapAllowed();
  res.json({ success: true, data: { allowed } });
});

const bootstrapAdmin = asyncHandler(async (req, res) => {
  const result = await authService.bootstrapFirstAdmin({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.status(201).json({ success: true, data: result });
});

module.exports = { login, register, signup, bootstrapStatus, bootstrapAdmin };
