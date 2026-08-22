const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { _findOwnedTrip } = require('./tripController');

// ---------- Screen 9: Trip Budget & Cost Breakdown ----------
exports.getBudget = catchAsync(async (req, res) => {
  const trip = await _findOwnedTrip(req.params.tripId, req.user.id);

  const [expenses, tripActivities] = await Promise.all([
    prisma.expense.findMany({ where: { tripId: trip.id } }),
    prisma.tripActivity.findMany({
      where: { tripStop: { tripId: trip.id } },
      select: { cost: true, scheduledDate: true },
    }),
  ]);

  const breakdown = { TRANSPORT: 0, STAY: 0, ACTIVITY: 0, MEAL: 0, OTHER: 0 };
  for (const e of expenses) breakdown[e.category] += Number(e.amount);
  for (const a of tripActivities) breakdown.ACTIVITY += Number(a.cost);

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  const days = Math.max(
    1,
    Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1
  );
  const avgPerDay = total / days;

  // Per-day cost, to flag overbudget days against the average
  const perDayMap = {};
  for (const e of expenses) {
    if (!e.date) continue;
    const key = e.date.toISOString().slice(0, 10);
    perDayMap[key] = (perDayMap[key] || 0) + Number(e.amount);
  }
  for (const a of tripActivities) {
    const key = a.scheduledDate.toISOString().slice(0, 10);
    perDayMap[key] = (perDayMap[key] || 0) + Number(a.cost);
  }
  const overBudgetDays = Object.entries(perDayMap)
    .filter(([, amount]) => amount > avgPerDay * 1.5)
    .map(([date, amount]) => ({ date, amount }));

  res.json({
    success: true,
    data: { breakdown, total, days, avgPerDay, perDay: perDayMap, overBudgetDays },
  });
});

// ---------- Add ad-hoc expense (transport/stay/meal/other) ----------
exports.addExpense = catchAsync(async (req, res) => {
  const trip = await _findOwnedTrip(req.params.tripId, req.user.id);
  const { category, amount, note, date, tripStopId } = req.body;
  if (!category || amount === undefined) throw new ApiError(400, 'category and amount are required.');

  const expense = await prisma.expense.create({
    data: {
      tripId: trip.id,
      category,
      amount,
      note,
      date: date ? new Date(date) : null,
      tripStopId: tripStopId || null,
    },
  });

  res.status(201).json({ success: true, data: { expense } });
});

exports.deleteExpense = catchAsync(async (req, res) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new ApiError(404, 'Expense not found.');
  await _findOwnedTrip(expense.tripId, req.user.id);
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Expense deleted.' });
});

// ---------- Screen 10: Trip Calendar / Timeline ----------
exports.getCalendar = catchAsync(async (req, res) => {
  const trip = await _findOwnedTrip(req.params.tripId, req.user.id);

  const stops = await prisma.tripStop.findMany({
    where: { tripId: trip.id },
    orderBy: { orderIndex: 'asc' },
    include: {
      city: true,
      activities: { include: { activity: true }, orderBy: { scheduledDate: 'asc' } },
    },
  });

  // Group activities by calendar day for a day-wise timeline
  const dayMap = {};
  for (const stop of stops) {
    for (const act of stop.activities) {
      const key = act.scheduledDate.toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push({
        id: act.id,
        title: act.customName || act.activity?.name || 'Activity',
        city: stop.city.name,
        time: act.scheduledTime,
        cost: act.cost,
        category: act.category,
      });
    }
  }

  const days = Object.keys(dayMap)
    .sort()
    .map((date) => ({ date, items: dayMap[date] }));

  res.json({ success: true, data: { tripName: trip.name, startDate: trip.startDate, endDate: trip.endDate, days } });
});
