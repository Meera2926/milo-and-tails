const asyncHandler = require('../middleware/asyncHandler');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { toFileMeta } = require('../middleware/upload');
const notify = require('../utils/notify');

const parseMaybeJson = (v, fallback) => {
  if (v === undefined) return undefined;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

// GET /api/providers  — public directory with search + filters
exports.search = asyncHandler(async (req, res) => {
  const { q, category, city, minRating, maxPrice, page = 1, limit = 12, sort = 'rating' } = req.query;
  const filter = { status: 'verified' };

  if (category) filter.categories = category;
  if (city) filter.city = new RegExp(String(city).trim(), 'i');
  if (minRating) filter['rating.average'] = { $gte: Number(minRating) };
  if (q) {
    filter.$or = [
      { businessName: new RegExp(String(q).trim(), 'i') },
      { description: new RegExp(String(q).trim(), 'i') },
    ];
  }

  const sortMap = {
    rating: { 'rating.average': -1, 'rating.count': -1 },
    experience: { experienceYears: -1 },
    price: { priceFrom: 1 },
    newest: { createdAt: -1 },
  };

  let providers = await ServiceProvider.find(filter)
    .populate('user', 'name email phone')
    .sort(sortMap[sort] || sortMap.rating)
    .lean();

  // Price filter needs the provider's cheapest active service in the category
  const ids = providers.map((p) => p._id);
  const services = await Service.find({ provider: { $in: ids }, isActive: true }).lean();
  const byProvider = new Map();
  services.forEach((s) => {
    const key = String(s.provider);
    if (!byProvider.has(key)) byProvider.set(key, []);
    byProvider.get(key).push(s);
  });

  providers = providers.map((p) => {
    const list = (byProvider.get(String(p._id)) || []).filter((s) => !category || s.category === category);
    const cheapest = list.reduce((min, s) => (min === null || s.price < min ? s.price : min), null);
    return { ...p, services: list, priceFrom: cheapest ?? p.priceFrom ?? null, serviceCount: list.length };
  });

  if (maxPrice) providers = providers.filter((p) => p.priceFrom !== null && p.priceFrom <= Number(maxPrice));
  if (category) providers = providers.filter((p) => p.serviceCount > 0);

  const start = (Number(page) - 1) * Number(limit);
  res.json({
    total: providers.length,
    page: Number(page),
    pages: Math.max(1, Math.ceil(providers.length / Number(limit))),
    providers: providers.slice(start, start + Number(limit)),
  });
});

// GET /api/providers/:id
exports.getOne = asyncHandler(async (req, res) => {
  const provider = await ServiceProvider.findById(req.params.id).populate('user', 'name email phone city');
  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }
  const [services, reviews] = await Promise.all([
    Service.find({ provider: provider._id, isActive: true }).sort('price'),
    Review.find({ provider: provider._id }).populate('owner', 'name avatar').populate('pet', 'name').sort('-createdAt'),
  ]);
  res.json({ provider, services, reviews });
});

// GET /api/providers/me
exports.myProfile = asyncHandler(async (req, res) => {
  const provider = await ServiceProvider.findOne({ user: req.user._id });
  res.json(provider);
});

// POST /api/providers  — create or update the signed-in provider's profile
exports.upsertMyProfile = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  body.categories = parseMaybeJson(body.categories, []) ?? body.categories;
  body.handlesAnimalTypes = parseMaybeJson(body.handlesAnimalTypes, []) ?? body.handlesAnimalTypes;
  body.handlesSizes = parseMaybeJson(body.handlesSizes, []) ?? body.handlesSizes;
  body.availability = parseMaybeJson(body.availability, []) ?? body.availability;
  if (req.file) body.photo = toFileMeta(req.file).url;

  let provider = await ServiceProvider.findOne({ user: req.user._id });

  if (!provider) {
    provider = await ServiceProvider.create({ ...body, user: req.user._id, status: 'pending' });
    return res.status(201).json(provider);
  }

  const editable = [
    'businessName', 'categories', 'description', 'experienceYears', 'city', 'address',
    'phone', 'photo', 'handlesAnimalTypes', 'handlesSizes', 'priceFrom', 'availability',
  ];
  editable.forEach((f) => {
    if (body[f] !== undefined) provider[f] = body[f];
  });
  // Any edit to a rejected profile sends it back for review
  if (provider.status === 'rejected') {
    provider.status = 'pending';
    provider.rejectionReason = '';
  }
  await provider.save();
  return res.json(provider);
});

// GET /api/providers/me/stats
exports.myStats = asyncHandler(async (req, res) => {
  const provider = await ServiceProvider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Create your provider profile first');
  }
  const [counts, services, reviews] = await Promise.all([
    Booking.aggregate([
      { $match: { provider: provider._id } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]),
    Service.countDocuments({ provider: provider._id, isActive: true }),
    Review.find({ provider: provider._id }).populate('owner', 'name').sort('-createdAt').limit(5),
  ]);
  const byStatus = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.n }), {});
  const earnings = await Booking.aggregate([
    { $match: { provider: provider._id, status: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);
  res.json({
    provider,
    requested: byStatus.Requested || 0,
    accepted: byStatus.Accepted || 0,
    completed: byStatus.Completed || 0,
    rejected: byStatus.Rejected || 0,
    cancelled: byStatus.Cancelled || 0,
    activeServices: services,
    totalEarnings: earnings[0]?.total || 0,
    recentReviews: reviews,
  });
});

// PATCH /api/providers/:id/status  (admin)
exports.setStatus = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body;
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Status must be verified, rejected or pending');
  }
  const provider = await ServiceProvider.findById(req.params.id);
  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }
  provider.status = status;
  provider.rejectionReason = status === 'rejected' ? reason : '';
  await provider.save();

  await notify(provider.user, {
    type: 'provider',
    title: status === 'verified' ? 'Your provider profile is verified' : `Provider profile ${status}`,
    message:
      status === 'verified'
        ? 'You can now publish services and receive booking requests.'
        : reason || 'Update your profile details and resubmit for review.',
    link: '/provider/profile',
  });

  res.json(provider);
});
