const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/booking.controller');

router.use(protect);

router.post(
  '/',
  authorize('owner'),
  [
    body('petId').notEmpty().withMessage('Choose a pet'),
    body('serviceId').notEmpty().withMessage('Choose a service'),
    body('date').notEmpty().withMessage('Choose a date'),
    body('timeSlot').notEmpty().withMessage('Choose a time slot'),
  ],
  validate,
  c.create
);

router.get('/mine', authorize('owner'), c.myBookings);
router.get('/provider', authorize('provider'), c.providerBookings);
router.get('/:id', c.getOne);
router.patch(
  '/:id/status',
  [body('status').isIn(['Accepted', 'Rejected', 'Completed', 'Cancelled']).withMessage('Invalid booking status')],
  validate,
  c.updateStatus
);

module.exports = router;
