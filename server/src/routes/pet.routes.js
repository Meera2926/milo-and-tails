const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const c = require('../controllers/pet.controller');

router.use(protect);

router.get('/', authorize('owner', 'admin'), c.listMyPets);
router.post(
  '/',
  authorize('owner', 'admin'),
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Enter your pet\u2019s name'),
    body('animalType').notEmpty().withMessage('Choose an animal type'),
  ],
  validate,
  c.createPet
);

router.get('/:id', c.getPet);
router.put('/:id', upload.single('photo'), c.updatePet);
router.delete('/:id', c.deletePet);

router.post('/:id/weight', c.addWeight);
router.delete('/:id/weight/:entryId', c.deleteWeight);

router.get('/:id/dashboard', c.petDashboard);
router.get('/:id/timeline', c.petTimeline);

router.get('/:id/qr', c.getPetQr);
router.post('/:id/qr/regenerate', c.regenerateQr);
router.get('/:id/scans', c.petScans);

module.exports = router;
