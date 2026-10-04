const mongoose = require('mongoose');

const BOOKING_STATUSES = ['Requested', 'Accepted', 'Completed', 'Rejected', 'Cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, maxlength: 500 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'Requested', index: true },
    statusReason: { type: String, maxlength: 300 },
    completedAt: { type: Date },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ provider: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
