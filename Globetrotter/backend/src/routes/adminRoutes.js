const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);
router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.get('/trips', ctrl.listAllTrips);

module.exports = router;
