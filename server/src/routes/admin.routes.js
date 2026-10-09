const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/admin.controller');

router.use(protect, authorize('admin'));

router.get('/stats', c.stats);
router.get('/users', c.listUsers);
router.patch('/users/:id/active', c.toggleUserActive);
router.get('/providers', c.listProviders);
router.get('/services', c.listServices);
router.get('/bookings', c.listBookings);

module.exports = router;
