const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

// ---------- Screen 8: Activity Search ----------
// GET /api/cities/:cityId/activities?category=&maxCost=&maxDuration=
exports.listActivitiesForCity = catchAsync(async (req, res) => {
  const { cityId } = req.params;
  const { category, maxCost, maxDuration, search } = req.query;

  const where = {
    cityId,
    ...(category && { category }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(maxCost && { cost: { lte: Number(maxCost) } }),
    ...(maxDuration && { durationMin: { lte: Number(maxDuration) } }),
  };

  const activities = await prisma.activity.findMany({ where, orderBy: { cost: 'asc' } });
  res.json({ success: true, data: { activities } });
});

exports.createActivity = catchAsync(async (req, res) => {
  const { cityId } = req.params;
  const { name, category, cost, durationMin, description, imageUrl } = req.body;
  const activity = await prisma.activity.create({
    data: { cityId, name, category, cost, durationMin, description, imageUrl },
  });
  res.status(201).json({ success: true, data: { activity } });
});

// ---------- Add/remove an activity to/from a trip stop's day plan ----------
exports.addActivityToStop = catchAsync(async (req, res) => {
  const prismaClient = require('../config/prisma');
  const { stopId } = req.params;
  const { activityId, customName, category, scheduledDate, scheduledTime, cost, notes } = req.body;

  // Ownership check via the stop's trip
  const stop = await prismaClient.tripStop.findUnique({ where: { id: stopId }, include: { trip: true } });
  if (!stop) return res.status(404).json({ success: false, message: 'Trip stop not found.' });
  if (stop.trip.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You do not have access to this trip.' });
  }

  let resolvedCost = cost;
  let resolvedCategory = category;
  if (activityId && (resolvedCost === undefined || resolvedCategory === undefined)) {
    const catalogActivity = await prismaClient.activity.findUnique({ where: { id: activityId } });
    if (catalogActivity) {
      resolvedCost = resolvedCost ?? catalogActivity.cost;
      resolvedCategory = resolvedCategory ?? catalogActivity.category;
    }
  }

  const tripActivity = await prismaClient.tripActivity.create({
    data: {
      tripStopId: stopId,
      activityId: activityId || null,
      customName: customName || null,
      category: resolvedCategory || 'OTHER',
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      cost: resolvedCost || 0,
      notes,
    },
    include: { activity: true },
  });

  res.status(201).json({ success: true, data: { tripActivity } });
});

exports.updateTripActivity = catchAsync(async (req, res) => {
  const prismaClient = require('../config/prisma');
  const existing = await prismaClient.tripActivity.findUnique({
    where: { id: req.params.id },
    include: { tripStop: { include: { trip: true } } },
  });
  if (!existing) return res.status(404).json({ success: false, message: 'Activity not found.' });
  if (existing.tripStop.trip.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You do not have access to this trip.' });
  }

  const { customName, category, scheduledDate, scheduledTime, cost, notes } = req.body;
  const tripActivity = await prismaClient.tripActivity.update({
    where: { id: req.params.id },
    data: {
      ...(customName !== undefined && { customName }),
      ...(category !== undefined && { category }),
      ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
      ...(scheduledTime !== undefined && { scheduledTime }),
      ...(cost !== undefined && { cost }),
      ...(notes !== undefined && { notes }),
    },
  });

  res.json({ success: true, data: { tripActivity } });
});

exports.deleteTripActivity = catchAsync(async (req, res) => {
  const prismaClient = require('../config/prisma');
  const existing = await prismaClient.tripActivity.findUnique({
    where: { id: req.params.id },
    include: { tripStop: { include: { trip: true } } },
  });
  if (!existing) return res.status(404).json({ success: false, message: 'Activity not found.' });
  if (existing.tripStop.trip.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You do not have access to this trip.' });
  }
  await prismaClient.tripActivity.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Activity removed from itinerary.' });
});
