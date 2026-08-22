const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { _findOwnedTrip } = require('./tripController');

async function findOwnedStop(stopId, userId) {
  const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, include: { trip: true } });
  if (!stop) throw new ApiError(404, 'Trip stop not found.');
  if (stop.trip.userId !== userId) throw new ApiError(403, 'You do not have access to this trip.');
  return stop;
}

// ---------- Screen 5: "Add Stop" button ----------
exports.addStop = catchAsync(async (req, res) => {
  const trip = await _findOwnedTrip(req.params.tripId, req.user.id);
  const { cityId, arrivalDate, departureDate, orderIndex } = req.body;
  if (!cityId || !arrivalDate || !departureDate) {
    throw new ApiError(400, 'cityId, arrivalDate and departureDate are required.');
  }

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new ApiError(404, 'City not found.');

  const count = await prisma.tripStop.count({ where: { tripId: trip.id } });

  const stop = await prisma.tripStop.create({
    data: {
      tripId: trip.id,
      cityId,
      arrivalDate: new Date(arrivalDate),
      departureDate: new Date(departureDate),
      orderIndex: orderIndex ?? count,
    },
    include: { city: true },
  });

  res.status(201).json({ success: true, data: { stop } });
});

exports.updateStop = catchAsync(async (req, res) => {
  await findOwnedStop(req.params.stopId, req.user.id);
  const { arrivalDate, departureDate, orderIndex } = req.body;

  const stop = await prisma.tripStop.update({
    where: { id: req.params.stopId },
    data: {
      ...(arrivalDate !== undefined && { arrivalDate: new Date(arrivalDate) }),
      ...(departureDate !== undefined && { departureDate: new Date(departureDate) }),
      ...(orderIndex !== undefined && { orderIndex }),
    },
    include: { city: true },
  });

  res.json({ success: true, data: { stop } });
});

exports.deleteStop = catchAsync(async (req, res) => {
  await findOwnedStop(req.params.stopId, req.user.id);
  await prisma.tripStop.delete({ where: { id: req.params.stopId } });
  res.json({ success: true, message: 'Stop removed.' });
});

// ---------- "reorder cities" drag-to-reorder ----------
// body: { order: [stopId1, stopId2, ...] } in the new desired order
exports.reorderStops = catchAsync(async (req, res) => {
  const trip = await _findOwnedTrip(req.params.tripId, req.user.id);
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    throw new ApiError(400, 'order must be a non-empty array of stop IDs.');
  }

  await prisma.$transaction(
    order.map((stopId, index) =>
      prisma.tripStop.updateMany({
        where: { id: stopId, tripId: trip.id },
        data: { orderIndex: index },
      })
    )
  );

  const stops = await prisma.tripStop.findMany({
    where: { tripId: trip.id },
    orderBy: { orderIndex: 'asc' },
    include: { city: true },
  });

  res.json({ success: true, data: { stops } });
});
