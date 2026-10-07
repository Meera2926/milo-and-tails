const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');

// GET /api/notifications
exports.list = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(50),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ items, unread });
});

// PATCH /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!n) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json(n);
});

// PATCH /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All caught up' });
});

// DELETE /api/notifications/:id
exports.remove = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Notification removed' });
});
