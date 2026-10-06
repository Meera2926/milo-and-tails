const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const c = require('../controllers/provider.controller');

router.get('/', c.search); // public directory

router.get('/me', protect, authorize('provider'), c.myProfile);
router.get('/me/stats', protect, authorize('provider'), c.myStats);
router.post(
  '/',
  protect,
  authorize('provider'),
  upload.single('photo'),
  [
    body('businessName').trim().notEmpty().withMessage('Enter your business name'),
    body('city').trim().notEmpty().withMessage('Enter the city you serve'),
  ],
  validate,
  c.upsertMyProfile
);

router.patch('/:id/status', protect, authorize('admin'), c.setStatus);
router.get('/:id', c.getOne);

module.exports = router;
