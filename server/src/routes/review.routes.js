const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/review.controller');

router.get('/provider/:providerId', c.listForProvider);
router.get('/mine', protect, authorize('owner'), c.mine);
router.post(
  '/',
  protect,
  authorize('owner'),
  [
    body('bookingId').notEmpty().withMessage('Choose the booking you are reviewing'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Give a rating between 1 and 5'),
  ],
  validate,
  c.create
);
router.delete('/:id', protect, c.remove);

module.exports = router;
