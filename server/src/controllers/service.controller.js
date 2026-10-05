const asyncHandler = require('../middleware/asyncHandler');
const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');

async function myVerifiedProvider(user, { requireVerified = true } = {}) {
  const provider = await ServiceProvider.findOne({ user: user._id });
  if (!provider) {
    const err = new Error('Create your provider profile first');
    err.status = 400;
    throw err;
  }
  if (requireVerified && provider.status !== 'verified') {
    const err = new Error('An admin needs to verify your profile before you can publish services');
    err.status = 403;
    throw err;
  }
  return provider;
}

// GET /api/services  — public listing with filters
exports.list = asyncHandler(async (req, res) => {
  const { category, q, maxPrice, animalType } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (animalType) filter.animalTypes = animalType;
  if (maxPrice) filter.price = { $lte: Number(maxPrice) };
  if (q) filter.title = new RegExp(String(q).trim(), 'i');

  const services = await Service.find(filter)
    .populate({ path: 'provider', match: { status: 'verified' }, select: 'businessName city rating experienceYears photo' })
    .sort('price');

  res.json(services.filter((s) => s.provider));
});

// GET /api/services/mine
exports.mine = asyncHandler(async (req, res) => {
  const provider = await myVerifiedProvider(req.user, { requireVerified: false });
  const services = await Service.find({ provider: provider._id }).sort('-createdAt');
  res.json(services);
});

// GET /api/services/:id
exports.getOne = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider');
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json(service);
});

// POST /api/services
exports.create = asyncHandler(async (req, res) => {
  const provider = await myVerifiedProvider(req.user);
  const service = await Service.create({ ...req.body, provider: provider._id });
  if (!provider.categories.includes(service.category)) {
    provider.categories.push(service.category);
    await provider.save();
  }
  res.status(201).json(service);
});

async function loadOwnService(req) {
  const provider = await myVerifiedProvider(req.user, { requireVerified: false });
  const service = await Service.findById(req.params.id);
  if (!service) {
    const err = new Error('Service not found');
    err.status = 404;
    throw err;
  }
  if (String(service.provider) !== String(provider._id)) {
    const err = new Error('This service belongs to another provider');
    err.status = 403;
    throw err;
  }
  return service;
}

// PUT /api/services/:id
exports.update = asyncHandler(async (req, res) => {
  const service = await loadOwnService(req);
  ['title', 'category', 'description', 'price', 'durationMins', 'animalTypes', 'availableDates', 'isActive'].forEach(
    (f) => {
      if (req.body[f] !== undefined) service[f] = req.body[f];
    }
  );
  await service.save();
  res.json(service);
});

// DELETE /api/services/:id
exports.remove = asyncHandler(async (req, res) => {
  const service = await loadOwnService(req);
  await service.deleteOne();
  res.json({ message: 'Service removed' });
});

// GET /api/services/:id/slots?date=YYYY-MM-DD  — open slots after removing booked ones
exports.availableSlots = asyncHandler(async (req, res) => {
  const Booking = require('../models/Booking');
  const { sameDay, dayKey } = require('../utils/dates');
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('Pick a date to see open time slots');
  }
  const service = await Service.findById(req.params.id).populate('provider');
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const target = new Date(date);
  const specific = (service.availableDates || []).find((d) => sameDay(d.date, target));
  const weekly = (service.provider.availability || []).find((a) => a.day === dayKey(target));
  const slots = specific?.slots?.length ? specific.slots : weekly?.slots || [];

  const taken = await Booking.find({
    provider: service.provider._id,
    date: { $gte: new Date(target.setHours(0, 0, 0, 0)), $lte: new Date(target.setHours(23, 59, 59, 999)) },
    status: { $in: ['Requested', 'Accepted', 'Completed'] },
  }).select('timeSlot');

  const takenSet = new Set(taken.map((b) => b.timeSlot));
  res.json({
    date,
    slots: slots.map((s) => ({ slot: s, available: !takenSet.has(s) })),
  });
});
