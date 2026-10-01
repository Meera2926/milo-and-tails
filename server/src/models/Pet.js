const mongoose = require('mongoose');
const crypto = require('crypto');

const weightEntrySchema = new mongoose.Schema(
  {
    weightKg: { type: Number, required: true, min: 0.1, max: 200 },
    date: { type: Date, default: Date.now },
    note: { type: String, maxlength: 200 },
  },
  { _id: true }
);

const petSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Pet name is required'], trim: true, maxlength: 60 },
    photo: { type: String, default: '' },
    animalType: {
      type: String,
      required: true,
      enum: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Other'],
    },
    breed: { type: String, trim: true, maxlength: 80 },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    size: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
    weightKg: { type: Number, min: 0.1, max: 200 },
    weightHistory: [weightEntrySchema],
    description: { type: String, maxlength: 600 },
    medicalWarning: { type: String, maxlength: 300 }, // shown on the public lost-pet page
    // Owner controls exactly what a finder can see after scanning the QR tag
    publicProfile: {
      showBreed: { type: Boolean, default: true },
      showDescription: { type: Boolean, default: true },
      showMedicalWarning: { type: Boolean, default: true },
      showOwnerName: { type: Boolean, default: false },
      showOwnerPhone: { type: Boolean, default: false },
    },
    qrToken: { type: String, unique: true, index: true },
    isLost: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

petSchema.virtual('ageText').get(function ageText() {
  if (!this.dob) return 'Unknown';
  const months = Math.max(0, Math.floor((Date.now() - this.dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
  return m === 0 ? `${y} year${y === 1 ? '' : 's'}` : `${y}y ${m}m`;
});

petSchema.pre('validate', function assignToken(next) {
  if (!this.qrToken) this.qrToken = crypto.randomBytes(8).toString('hex');
  next();
});

module.exports = mongoose.model('Pet', petSchema);
