const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/service.controller');

router.get('/', c.list);
router.get('/mine', protect, authorize('provider'), c.mine);
router.get('/:id/slots', c.availableSlots);
router.get('/:id', c.getOne);

router.post(
  '/',
  protect,
  authorize('provider'),
  [
    body('title').trim().notEmpty().withMessage('Give the service a title'),
    body('category').notEmpty().withMessage('Choose a service category'),
    body('price').isFloat({ min: 0 }).withMessage('Enter a price of 0 or more'),
  ],
  validate,
  c.create
);
router.put('/:id', protect, authorize('provider'), c.update);
router.delete('/:id', protect, authorize('provider'), c.remove);

module.exports = router;
