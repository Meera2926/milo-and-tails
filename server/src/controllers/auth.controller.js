const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const { signToken, publicUser } = require('../utils/token');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'owner', phone, city } = req.body;

  if (role === 'admin') {
    res.status(403);
    throw new Error('Admin accounts are created by an existing admin');
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('That email already has an account. Try signing in.');
  }

  const user = await User.create({ name, email, password, role, phone, city });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Email or password is incorrect');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact the Milo & Tails admin.');
  }

  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const payload = { user: publicUser(req.user) };
  if (req.user.role === 'provider') {
    payload.providerProfile = await ServiceProvider.findOne({ user: req.user._id });
  }
  res.json(payload);
});

// PUT /api/auth/me
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ user: publicUser(user) });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});
