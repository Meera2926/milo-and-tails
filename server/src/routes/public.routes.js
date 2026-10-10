const router = require('express').Router();
const c = require('../controllers/public.controller');

// No auth: these are the endpoints a finder hits after scanning a collar tag.
router.get('/pet/:token', c.lostPetProfile);
router.post('/pet/:token/found', c.reportFound);

module.exports = router;
