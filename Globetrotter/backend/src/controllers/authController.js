const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  photoUrl: u.photoUrl,
  languagePref: u.languagePref,
  role: u.role,
  createdAt: u.createdAt,
});

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required.');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { user: publicUser(user), token } });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required.');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid email or password.');

  const token = signToken(user);
  res.json({ success: true, data: { user: publicUser(user), token } });
});

// Simple hackathon-scope "forgot password": issues a reset token.
// In production this would be emailed; here it's returned in the
// response so the frontend can build a working flow without an SMTP setup.
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond success to avoid leaking which emails are registered.
  if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp: new Date(Date.now() + 60 * 60 * 1000) },
  });

  res.json({
    success: true,
    message: 'If that email exists, a reset link was sent.',
    devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new ApiError(400, 'token and newPassword are required.');

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExp: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired.');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExp: null },
  });

  res.json({ success: true, message: 'Password updated. Please log in again.' });
});

exports.me = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ success: true, data: { user: publicUser(user) } });
});
