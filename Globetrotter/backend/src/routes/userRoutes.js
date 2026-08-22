const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.put('/me', ctrl.updateProfile);
router.delete('/me', ctrl.deleteAccount);
router.get('/me/saved-cities', ctrl.savedDestinations);

module.exports = router;
