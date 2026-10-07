const Notification = require('../models/Notification');

// Small helper so controllers stay readable. Never throws into the request path.
async function notify(userId, { type = 'system', title, message = '', link = '' }) {
  try {
    if (!userId || !title) return null;
    return await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('Notification failed:', err.message);
    return null;
  }
}

module.exports = notify;
