const mongoose = require('mongoose');
const { SERVICE_CATEGORIES } = require('./ServiceProvider');

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: SERVICE_CATEGORIES },
    description: { type: String, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    durationMins: { type: Number, default: 60, min: 10, max: 1440 },
    animalTypes: { type: [String], default: ['Dog', 'Cat'] },
    // Specific dates the provider opened up, plus the slots on each date
    availableDates: [
      {
        date: { type: Date, required: true },
        slots: [{ type: String }],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
