const mongoose = require('mongoose');

// One record per QR tag scan. Location is only stored when the finder
// explicitly grants browser location permission and presses "Share found location".
const qrScanSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    hasLocation: { type: Boolean, default: false },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracyMeters: { type: Number },
    finderName: { type: String, maxlength: 80 },
    finderContact: { type: String, maxlength: 80 },
    message: { type: String, maxlength: 500 },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QrScan', qrScanSchema);
