const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Pet = require('../models/Pet');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const QrScan = require('../models/QrScan');
const { addDays } = require('../utils/dates');

// GET /api/admin/stats
exports.stats = asyncHandler(async (req, res) => {
  const last30 = addDays(new Date(), -30);
  const [
    owners, providers, pendingProviders, pets, services, bookings, reviews, scans, byStatus, byCategory,
  ] = await Promise.all([
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'provider' }),
    ServiceProvider.countDocuments({ status: 'pending' }),
    Pet.countDocuments({}),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments({}),
    Review.countDocuments({}),
    QrScan.countDocuments({ hasLocation: true }),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 's' } },
      { $unwind: '$s' },
      { $group: { _id: '$s.category', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]),
  ]);

  const recentBookings = await Booking.countDocuments({ createdAt: { $gte: last30 } });

  res.json({
    users: { owners, providers, total: owners + providers },
    pendingProviders,
    pets,
    services,
    bookings,
    bookingsLast30Days: recentBookings,
    reviews,
    locationsShared: scans,
    bookingsByStatus: byStatus.map((b) => ({ status: b._id, count: b.n })),
    bookingsByCategory: byCategory.map((b) => ({ category: b._id, count: b.n })),
  });
});

// GET /api/admin/users
exports.listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: new RegExp(String(q).trim(), 'i') }, { email: new RegExp(String(q).trim(), 'i') }];
  const users = await User.find(filter).sort('-createdAt').limit(200);
  res.json(users);
});

// PATCH /api/admin/users/:id/active
exports.toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Admin accounts cannot be deactivated here');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ _id: user._id, isActive: user.isActive });
});

// GET /api/admin/providers
exports.listProviders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const providers = await ServiceProvider.find(filter).populate('user', 'name email phone isActive').sort('-createdAt');
  res.json(providers);
});

// GET /api/admin/services
exports.listServices = asyncHandler(async (req, res) => {
  const services = await Service.find({}).populate('provider', 'businessName city status').sort('-createdAt').limit(200);
  res.json(services);
});

// GET /api/admin/bookings
exports.listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate('owner', 'name email')
    .populate('pet', 'name animalType')
    .populate('provider', 'businessName')
    .populate('service', 'title category')
    .sort('-createdAt')
    .limit(200);
  res.json(bookings);
});
