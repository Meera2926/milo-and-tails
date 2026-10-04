const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const c = require('../controllers/healthRecord.controller');

router.use(protect);

router.get('/pet/:petId', c.listForPet);
router.post(
  '/pet/:petId',
  upload.array('attachments', 5),
  [body('type').notEmpty().withMessage('Choose a record type'), body('title').trim().notEmpty().withMessage('Add a title')],
  validate,
  c.create
);
router.put('/:id', upload.array('attachments', 5), c.update);
router.delete('/:id', c.remove);

module.exports = router;
