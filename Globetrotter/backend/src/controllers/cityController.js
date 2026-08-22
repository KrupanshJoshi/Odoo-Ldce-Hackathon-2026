const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

// ---------- Screen 7: City Search ----------
// GET /api/cities?search=&country=&region=&sort=popularity&page=&limit=
exports.searchCities = catchAsync(async (req, res) => {
  const { search, country, region, sort = 'popularity', page = 1, limit = 20 } = req.query;

  const where = {
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(country && { country: { equals: country, mode: 'insensitive' } }),
    ...(region && { region: { equals: region, mode: 'insensitive' } }),
  };

  const orderBy =
    sort === 'name' ? { name: 'asc' } : sort === 'cost' ? { costIndex: 'asc' } : { popularity: 'desc' };

  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [cities, total] = await Promise.all([
    prisma.city.findMany({ where, orderBy, take, skip }),
    prisma.city.count({ where }),
  ]);

  res.json({ success: true, data: { cities, total, page: Number(page), limit: take } });
});

exports.getCity = catchAsync(async (req, res) => {
  const city = await prisma.city.findUnique({ where: { id: req.params.id } });
  if (!city) return res.status(404).json({ success: false, message: 'City not found.' });
  res.json({ success: true, data: { city } });
});

// Admin-only create, used to seed/expand the catalog from the frontend if needed
exports.createCity = catchAsync(async (req, res) => {
  const { name, country, region, costIndex, popularity, imageUrl } = req.body;
  const city = await prisma.city.create({
    data: { name, country, region, costIndex, popularity, imageUrl },
  });
  res.status(201).json({ success: true, data: { city } });
});

exports.saveCity = catchAsync(async (req, res) => {
  const saved = await prisma.savedCity.upsert({
    where: { userId_cityId: { userId: req.user.id, cityId: req.params.id } },
    update: {},
    create: { userId: req.user.id, cityId: req.params.id },
  });
  res.status(201).json({ success: true, data: { saved } });
});

exports.unsaveCity = catchAsync(async (req, res) => {
  await prisma.savedCity.deleteMany({ where: { userId: req.user.id, cityId: req.params.id } });
  res.json({ success: true, message: 'Removed from saved destinations.' });
});
