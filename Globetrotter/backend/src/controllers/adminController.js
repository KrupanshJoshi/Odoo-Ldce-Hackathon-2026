const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

// ---------- Screen 13: Admin / Analytics Dashboard ----------
exports.getStats = catchAsync(async (req, res) => {
  const [userCount, tripCount, cityCount, activityCount] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.city.count(),
    prisma.activity.count(),
  ]);

  const topCities = await prisma.tripStop.groupBy({
    by: ['cityId'],
    _count: { cityId: true },
    orderBy: { _count: { cityId: 'desc' } },
    take: 5,
  });
  const cityDetails = await prisma.city.findMany({
    where: { id: { in: topCities.map((c) => c.cityId) } },
  });
  const topCitiesWithNames = topCities.map((tc) => ({
    city: cityDetails.find((c) => c.id === tc.cityId)?.name,
    tripCount: tc._count.cityId,
  }));

  const topActivityCategories = await prisma.tripActivity.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  const tripsPerMonth = await prisma.$queryRaw`
    SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
    FROM trips
    GROUP BY month
    ORDER BY month ASC
  `;

  res.json({
    success: true,
    data: {
      totals: { userCount, tripCount, cityCount, activityCount },
      topCities: topCitiesWithNames,
      topActivityCategories,
      tripsPerMonth,
    },
  });
});

exports.listUsers = catchAsync(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { trips: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { users } });
});

exports.listAllTrips = catchAsync(async (req, res) => {
  const trips = await prisma.trip.findMany({
    include: { user: { select: { name: true, email: true } }, _count: { select: { stops: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: { trips } });
});
