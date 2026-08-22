const express = require('express');
const router = express.Router();
const cityCtrl = require('../controllers/cityController');
const activityCtrl = require('../controllers/activityController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', cityCtrl.searchCities);
router.get('/:id', cityCtrl.getCity);
router.get('/:cityId/activities', activityCtrl.listActivitiesForCity);

router.post('/', requireAuth, requireAdmin, cityCtrl.createCity);
router.post('/:cityId/activities', requireAuth, requireAdmin, activityCtrl.createActivity);

router.post('/:id/save', requireAuth, cityCtrl.saveCity);
router.delete('/:id/save', requireAuth, cityCtrl.unsaveCity);

module.exports = router;
