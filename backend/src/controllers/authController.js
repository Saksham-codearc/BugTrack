const { User } = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');
const { publicUser } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // The very first account is a global administrator.
  const userCount = await User.estimatedDocumentCount();
  const user = await User.create({
    name,
    email,
    password,
    role: userCount === 0 ? 'admin' : 'user',
  });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarColor } = req.body;

  if (name !== undefined) req.user.name = name;
  if (avatarColor !== undefined) req.user.avatarColor = avatarColor;

  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Your current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Password updated successfully.',
    token: signToken(user),
  });
});

module.exports = { register, login, getMe, updateMe, changePassword };
