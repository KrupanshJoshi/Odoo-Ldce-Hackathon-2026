const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// ---------- Screen 12: User Profile / Settings ----------
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, photoUrl, languagePref, password } = req.body;

  const data = {
    ...(name !== undefined && { name }),
    ...(photoUrl !== undefined && { photoUrl }),
    ...(languagePref !== undefined && { languagePref }),
  };
  if (password) {
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        languagePref: user.languagePref,
        role: user.role,
      },
    },
  });
});

exports.deleteAccount = catchAsync(async (req, res) => {
  await prisma.user.delete({ where: { id: req.user.id } }); // cascades to trips, saved cities
  res.json({ success: true, message: 'Account deleted.' });
});

exports.savedDestinations = catchAsync(async (req, res) => {
  const saved = await prisma.savedCity.findMany({
    where: { userId: req.user.id },
    include: { city: true },
    orderBy: { savedAt: 'desc' },
  });
  res.json({ success: true, data: { cities: saved.map((s) => s.city) } });
});
