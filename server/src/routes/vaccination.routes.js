const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const c = require('../controllers/vaccination.controller');

router.use(protect);

router.get('/pet/:petId', c.listForPet);
router.post(
  '/pet/:petId',
  upload.single('document'),
  [
    body('name').trim().notEmpty().withMessage('Enter the vaccine name'),
    body('givenOn').notEmpty().withMessage('Enter the date it was given'),
  ],
  validate,
  c.create
);
router.put('/:id', upload.single('document'), c.update);
router.delete('/:id', c.remove);

module.exports = router;
