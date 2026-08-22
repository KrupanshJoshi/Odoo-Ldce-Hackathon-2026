const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripController');
const stopCtrl = require('../controllers/stopController');
const budgetCtrl = require('../controllers/budgetController');
const activityCtrl = require('../controllers/activityController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/dashboard', ctrl.dashboard);
router.get('/', ctrl.listMyTrips);
router.post('/', ctrl.createTrip);
router.get('/:id', ctrl.getTrip);
router.put('/:id', ctrl.updateTrip);
router.delete('/:id', ctrl.deleteTrip);

router.post('/:id/share', ctrl.shareTrip);
router.post('/:id/unshare', ctrl.unshareTrip);

// Stops (itinerary builder)
router.post('/:tripId/stops', stopCtrl.addStop);
router.put('/:tripId/stops/reorder', stopCtrl.reorderStops);

// Budget & calendar
router.get('/:tripId/budget', budgetCtrl.getBudget);
router.post('/:tripId/expenses', budgetCtrl.addExpense);
router.get('/:tripId/calendar', budgetCtrl.getCalendar);

module.exports = router;
