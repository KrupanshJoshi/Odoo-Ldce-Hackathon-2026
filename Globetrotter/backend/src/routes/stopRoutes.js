// Flat routes for operating directly on a stop/expense by its own id
// (mounted separately from /trips/:tripId/stops for update/delete).
const express = require('express');
const router = express.Router();
const stopCtrl = require('../controllers/stopController');
const activityCtrl = require('../controllers/activityController');
const budgetCtrl = require('../controllers/budgetController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.put('/stops/:stopId', stopCtrl.updateStop);
router.delete('/stops/:stopId', stopCtrl.deleteStop);

// Activities within a stop's day plan
router.post('/stops/:stopId/activities', activityCtrl.addActivityToStop);
router.put('/trip-activities/:id', activityCtrl.updateTripActivity);
router.delete('/trip-activities/:id', activityCtrl.deleteTripActivity);

// Expenses
router.delete('/expenses/:id', budgetCtrl.deleteExpense);

module.exports = router;
