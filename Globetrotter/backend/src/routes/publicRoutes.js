const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripController');
const { requireAuth } = require('../middleware/auth');

router.get('/trips/:slug', ctrl.getPublicTrip);
router.post('/trips/:slug/copy', requireAuth, ctrl.copyPublicTrip);

module.exports = router;
