const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/trips', require('./tripRoutes'));
router.use('/trips', require('./stopRoutes')); // adds /trips/stops/:stopId etc.
router.use('/cities', require('./cityRoutes'));
router.use('/public', require('./publicRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/admin', require('./adminRoutes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'GlobeTrotter API is running.' }));

module.exports = router;
