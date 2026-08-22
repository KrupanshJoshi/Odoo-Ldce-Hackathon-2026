const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { nanoid } = require('nanoid');

// ---------- Screen 3: Create Trip ----------
exports.createTrip = catchAsync(async (req, res) => {
  const { name, description, startDate, endDate, coverPhotoUrl } = req.body;
  if (!name || !startDate || !endDate) {
    throw new ApiError(400, 'name, startDate and endDate are required.');
  }
  if (new Date(startDate) > new Date(endDate)) {
    throw new ApiError(400, 'startDate must be before endDate.');
  }

  const trip = await prisma.trip.create({
    data: {
      userId: req.user.id,
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhotoUrl,
    },
  });

  res.status(201).json({ success: true, data: { trip } });
});

// ---------- Screen 4: My Trips (list + card summary) ----------
exports.listMyTrips = catchAsync(async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { userId: req.user.id },
    orderBy: { startDate: 'desc' },
    include: { stops: { include: { city: true } } },
  });

  const summarized = trips.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    coverPhotoUrl: t.coverPhotoUrl,
    isPublic: t.isPublic,
    destinationCount: t.stops.length,
    cities: t.stops.map((s) => s.city.name),
  }));

  res.json({ success: true, data: { trips: summarized } });
});

// ---------- Screen 2: Dashboard/Home ----------
exports.dashboard = catchAsync(async (req, res) => {
  const now = new Date();
  const [upcomingTrips, recentTrips, recommendedCities] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: req.user.id, startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    prisma.trip.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.city.findMany({ orderBy: { popularity: 'desc' }, take: 8 }),
  ]);

  // Budget highlight: sum of expenses + activity costs across all trips
  const [expenseAgg, activityAgg] = await Promise.all([
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { trip: { userId: req.user.id } },
    }),
    prisma.tripActivity.aggregate({
      _sum: { cost: true },
      where: { tripStop: { trip: { userId: req.user.id } } },
    }),
  ]);

  const totalSpendEstimate =
    Number(expenseAgg._sum.amount || 0) + Number(activityAgg._sum.cost || 0);

  res.json({
    success: true,
    data: { upcomingTrips, recentTrips, recommendedCities, totalSpendEstimate },
  });
});

async function findOwnedTrip(tripId, userId) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ApiError(404, 'Trip not found.');
  if (trip.userId !== userId) throw new ApiError(403, 'You do not have access to this trip.');
  return trip;
}

// ---------- Screen 5/6: Itinerary Builder / View (full nested trip) ----------
exports.getTrip = catchAsync(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      stops: {
        orderBy: { orderIndex: 'asc' },
        include: {
          city: true,
          activities: { include: { activity: true }, orderBy: { scheduledDate: 'asc' } },
        },
      },
    },
  });
  if (!trip) throw new ApiError(404, 'Trip not found.');
  if (trip.userId !== req.user.id && !trip.isPublic) {
    throw new ApiError(403, 'You do not have access to this trip.');
  }
  res.json({ success: true, data: { trip } });
});

exports.updateTrip = catchAsync(async (req, res) => {
  await findOwnedTrip(req.params.id, req.user.id);
  const { name, description, startDate, endDate, coverPhotoUrl } = req.body;

  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(coverPhotoUrl !== undefined && { coverPhotoUrl }),
    },
  });

  res.json({ success: true, data: { trip } });
});

exports.deleteTrip = catchAsync(async (req, res) => {
  await findOwnedTrip(req.params.id, req.user.id);
  await prisma.trip.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Trip deleted.' });
});

// ---------- Screen 11: Shared/Public Itinerary ----------
exports.shareTrip = catchAsync(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user.id);
  const shareSlug = trip.shareSlug || nanoid(10);
  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: { isPublic: true, shareSlug },
  });
  res.json({ success: true, data: { shareUrl: `/public/trips/${updated.shareSlug}` } });
});

exports.unshareTrip = catchAsync(async (req, res) => {
  await findOwnedTrip(req.params.id, req.user.id);
  await prisma.trip.update({ where: { id: req.params.id }, data: { isPublic: false } });
  res.json({ success: true, message: 'Trip is now private.' });
});

exports.getPublicTrip = catchAsync(async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { shareSlug: req.params.slug, isPublic: true },
    include: {
      user: { select: { name: true, photoUrl: true } },
      stops: {
        orderBy: { orderIndex: 'asc' },
        include: { city: true, activities: { include: { activity: true } } },
      },
    },
  });
  if (!trip) throw new ApiError(404, 'This itinerary is not available.');
  res.json({ success: true, data: { trip } });
});

// "Copy Trip" button on the public view — clones the trip (and stops/activities)
// into the requesting user's own account.
exports.copyPublicTrip = catchAsync(async (req, res) => {
  const source = await prisma.trip.findFirst({
    where: { shareSlug: req.params.slug, isPublic: true },
    include: { stops: { include: { activities: true } } },
  });
  if (!source) throw new ApiError(404, 'This itinerary is not available.');

  const newTrip = await prisma.trip.create({
    data: {
      userId: req.user.id,
      name: `${source.name} (copy)`,
      description: source.description,
      startDate: source.startDate,
      endDate: source.endDate,
      coverPhotoUrl: source.coverPhotoUrl,
      copiedFromId: source.id,
      stops: {
        create: source.stops.map((s) => ({
          cityId: s.cityId,
          arrivalDate: s.arrivalDate,
          departureDate: s.departureDate,
          orderIndex: s.orderIndex,
          activities: {
            create: s.activities.map((a) => ({
              activityId: a.activityId,
              customName: a.customName,
              category: a.category,
              scheduledDate: a.scheduledDate,
              scheduledTime: a.scheduledTime,
              cost: a.cost,
              notes: a.notes,
            })),
          },
        })),
      },
    },
    include: { stops: true },
  });

  res.status(201).json({ success: true, data: { trip: newTrip } });
});

exports._findOwnedTrip = findOwnedTrip; // reused by stopController/expenseController
