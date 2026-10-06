const asyncHandler = require('../middleware/asyncHandler');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const notify = require('../utils/notify');

// POST /api/reviews  — only after a completed booking, one review per booking
exports.create = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId).populate('provider').populate('service');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (String(booking.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only review your own bookings');
  }
  if (booking.status !== 'Completed') {
    res.status(400);
    throw new Error('You can review a provider once the service is marked completed');
  }
  if (booking.isReviewed) {
    res.status(409);
    throw new Error('You already reviewed this booking');
  }

  const review = await Review.create({
    booking: booking._id,
    provider: booking.provider._id,
    owner: req.user._id,
    pet: booking.pet,
    rating: Number(rating),
    comment,
  });

  booking.isReviewed = true;
  await booking.save();
  await Review.recalculateProviderRating(booking.provider._id);

  await notify(booking.provider.user, {
    type: 'provider',
    title: `New ${rating}-star review`,
    message: `${req.user.name} reviewed ${booking.service.title}.`,
    link: '/provider/reviews',
  });

  res.status(201).json(review);
});

// GET /api/reviews/provider/:providerId
exports.listForProvider = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ provider: req.params.providerId })
    .populate('owner', 'name avatar')
    .populate('pet', 'name animalType')
    .sort('-createdAt');
  res.json(reviews);
});

// GET /api/reviews/mine
exports.mine = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ owner: req.user._id })
    .populate('provider', 'businessName city')
    .sort('-createdAt');
  res.json(reviews);
});

// DELETE /api/reviews/:id  — author or admin
exports.remove = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (String(review.owner) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only delete your own review');
  }
  await Booking.findByIdAndUpdate(review.booking, { isReviewed: false });
  const providerId = review.provider;
  await review.deleteOne();
  await Review.recalculateProviderRating(providerId);
  res.json({ message: 'Review deleted' });
});
