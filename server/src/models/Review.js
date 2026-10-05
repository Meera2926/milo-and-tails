const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 800 },
  },
  { timestamps: true }
);

// Keeps the provider's average rating in sync after every review write
reviewSchema.statics.recalculateProviderRating = async function recalc(providerId) {
  const [agg] = await this.aggregate([
    { $match: { provider: new mongoose.Types.ObjectId(String(providerId)) } },
    { $group: { _id: '$provider', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('ServiceProvider').findByIdAndUpdate(providerId, {
    'rating.average': agg ? Math.round(agg.average * 10) / 10 : 0,
    'rating.count': agg ? agg.count : 0,
  });
};

module.exports = mongoose.model('Review', reviewSchema);
