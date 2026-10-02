const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  { url: String, name: String, mimetype: String, size: Number },
  { _id: true }
);

const healthRecordSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['Vet Visit', 'Treatment', 'Medication', 'Allergy', 'Condition', 'Medical Report', 'Prescription'],
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 1500 },
    date: { type: Date, required: true, default: Date.now },
    vetName: { type: String, trim: true, maxlength: 100 },
    clinic: { type: String, trim: true, maxlength: 120 },
    severity: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    // Only used when type === 'Medication'
    medication: {
      dosage: { type: String, maxlength: 80 },
      frequency: { type: String, maxlength: 80 },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
    },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
