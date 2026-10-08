const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/notification.controller');

router.use(protect);
router.get('/', c.list);
router.patch('/read-all', c.markAllRead);
router.patch('/:id/read', c.markRead);
router.delete('/:id', c.remove);

module.exports = router;
