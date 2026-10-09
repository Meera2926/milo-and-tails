const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/reminder.controller');

router.get('/', protect, authorize('owner', 'admin'), c.upcoming);

module.exports = router;
