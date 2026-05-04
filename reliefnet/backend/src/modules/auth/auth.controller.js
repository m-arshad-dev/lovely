const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');

const register = asyncHandler(async (req, res) => {
  const data = await service.register(req.body);
  res.status(201).json(success('userRegistered', data));
});

const login = asyncHandler(async (req, res) => {
  const data = await service.login(req.body);
  res.json(success('loginSuccess', data));
});

module.exports = { register, login };
