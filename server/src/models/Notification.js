const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking', 'reminder', 'qr-scan', 'provider', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, maxlength: 500 },
    link: { type: String, maxlength: 200 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
