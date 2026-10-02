const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: [true, 'Vaccine name is required'], trim: true, maxlength: 100 },
    givenOn: { type: Date, required: true },
    nextDueDate: { type: Date },
    vetName: { type: String, trim: true, maxlength: 100 },
    batchNo: { type: String, trim: true, maxlength: 60 },
    notes: { type: String, maxlength: 500 },
    document: { url: String, name: String },
  },
  { timestamps: true }
);

vaccinationSchema.index({ pet: 1, nextDueDate: 1 });

module.exports = mongoose.model('Vaccination', vaccinationSchema);
