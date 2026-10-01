const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Enter your name'),
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['owner', 'provider']).withMessage('Choose either pet owner or service provider'),
  ],
  validate,
  c.register
);

router.post(
  '/login',
  [body('email').isEmail().withMessage('Enter a valid email address'), body('password').notEmpty().withMessage('Enter your password')],
  validate,
  c.login
);

router.get('/me', protect, c.me);
router.put('/me', protect, c.updateProfile);
router.put('/password', protect, c.changePassword);

module.exports = router;
