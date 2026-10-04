const mongoose = require('mongoose');

const SERVICE_CATEGORIES = [
  'Veterinary Consultation',
  'Pet Grooming',
  'Pet Boarding',
  'Pet Sitting',
];

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
    slots: [{ type: String }], // e.g. "09:00 - 10:00"
  },
  { _id: false }
);

const serviceProviderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    categories: { type: [String], enum: SERVICE_CATEGORIES, default: [] },
    description: { type: String, maxlength: 1200 },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, maxlength: 250 },
    phone: { type: String, maxlength: 20 },
    photo: { type: String, default: '' },
    handlesAnimalTypes: { type: [String], default: ['Dog', 'Cat'] },
    handlesSizes: { type: [String], default: ['Small', 'Medium', 'Large'] },
    priceFrom: { type: Number, min: 0, default: 0 },
    availability: { type: [availabilitySchema], default: [] },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, maxlength: 300 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    completedBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceProviderSchema.statics.CATEGORIES = SERVICE_CATEGORIES;

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
module.exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
