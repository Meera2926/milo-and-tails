const asyncHandler = require('../middleware/asyncHandler');
const Booking = require('../models/Booking');
const Pet = require('../models/Pet');
const Service = require('../models/Service');
const ServiceProvider = require('../models/ServiceProvider');
const notify = require('../utils/notify');
const { startOfDay, endOfDay } = require('../utils/dates');

// Only these moves are legal, whoever is asking.
const TRANSITIONS = {
  Requested: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['Completed', 'Cancelled'],
  Completed: [],
  Rejected: [],
  Cancelled: [],
};

// POST /api/bookings
exports.create = asyncHandler(async (req, res) => {
  const { petId, serviceId, date, timeSlot, notes } = req.body;

  const pet = await Pet.findOne({ _id: petId, owner: req.user._id });
  if (!pet) {
    res.status(404);
    throw new Error('Pick one of your own pets for this booking');
  }

  const service = await Service.findById(serviceId).populate('provider');
  if (!service || !service.isActive) {
    res.status(404);
    throw new Error('That service is no longer available');
  }
  if (service.provider.status !== 'verified') {
    res.status(400);
    throw new Error('That provider is not verified yet');
  }
  if (service.animalTypes.length && !service.animalTypes.includes(pet.animalType)) {
    res.status(400);
    throw new Error(`${service.title} is not offered for ${pet.animalType.toLowerCase()}s`);
  }
  if (new Date(date) < startOfDay(new Date())) {
    res.status(400);
    throw new Error('Choose today or a future date');
  }

  const clash = await Booking.findOne({
    provider: service.provider._id,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    timeSlot,
    status: { $in: ['Requested', 'Accepted', 'Completed'] },
  });
  if (clash) {
    res.status(409);
    throw new Error('That time slot was just taken. Pick another one.');
  }

  const booking = await Booking.create({
    owner: req.user._id,
    pet: pet._id,
    provider: service.provider._id,
    service: service._id,
    date,
    timeSlot,
    price: service.price,
    notes,
  });

  await notify(service.provider.user, {
    type: 'booking',
    title: 'New booking request',
    message: `${req.user.name} requested ${service.title} for ${pet.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
    link: '/provider/bookings',
  });

  res.status(201).json(await booking.populate([{ path: 'service' }, { path: 'provider' }, { path: 'pet' }]));
});

// GET /api/bookings/mine  (owner)
exports.myBookings = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.petId) filter.pet = req.query.petId;
  const bookings = await Booking.find(filter)
    .populate('pet', 'name photo animalType breed')
    .populate('service', 'title category durationMins')
    .populate({ path: 'provider', select: 'businessName city phone rating photo' })
    .sort('-date');
  res.json(bookings);
});

// GET /api/bookings/provider  (provider)
exports.providerBookings = asyncHandler(async (req, res) => {
  const provider = await ServiceProvider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Create your provider profile first');
  }
  const filter = { provider: provider._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate('pet', 'name photo animalType breed size medicalWarning')
    .populate('service', 'title category durationMins')
    .populate('owner', 'name phone email city')
    .sort({ date: 1 });
  res.json(bookings);
});

// GET /api/bookings/:id
exports.getOne = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('pet')
    .populate('service')
    .populate('provider')
    .populate('owner', 'name phone email');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  const provider = await ServiceProvider.findOne({ user: req.user._id });
  const allowed =
    String(booking.owner._id) === String(req.user._id) ||
    (provider && String(booking.provider._id) === String(provider._id)) ||
    req.user.role === 'admin';
  if (!allowed) {
    res.status(403);
    throw new Error('You do not have access to this booking');
  }
  res.json(booking);
});

// PATCH /api/bookings/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body;
  const booking = await Booking.findById(req.params.id).populate('service').populate('pet').populate('provider');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const provider = await ServiceProvider.findOne({ user: req.user._id });
  const isOwner = String(booking.owner) === String(req.user._id);
  const isProvider = provider && String(booking.provider._id) === String(provider._id);

  if (!isOwner && !isProvider && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You do not have access to this booking');
  }
  if (isOwner && !isProvider && status !== 'Cancelled') {
    res.status(403);
    throw new Error('Owners can only cancel a booking');
  }
  if (!TRANSITIONS[booking.status].includes(status)) {
    res.status(400);
    throw new Error(`A ${booking.status.toLowerCase()} booking cannot move to ${status.toLowerCase()}`);
  }

  booking.status = status;
  booking.statusReason = reason;
  if (status === 'Completed') {
    booking.completedAt = new Date();
    await ServiceProvider.findByIdAndUpdate(booking.provider._id, { $inc: { completedBookings: 1 } });
  }
  await booking.save();

  const when = `${new Date(booking.date).toLocaleDateString()} at ${booking.timeSlot}`;
  if (isProvider) {
    await notify(booking.owner, {
      type: 'booking',
      title: `Booking ${status.toLowerCase()}`,
      message: `${booking.provider.businessName} marked ${booking.service.title} for ${booking.pet.name} (${when}) as ${status.toLowerCase()}.${reason ? ` Note: ${reason}` : ''}`,
      link: '/owner/bookings',
    });
  } else {
    await notify(booking.provider.user, {
      type: 'booking',
      title: 'Booking cancelled',
      message: `${booking.pet.name}'s ${booking.service.title} on ${when} was cancelled by the owner.`,
      link: '/provider/bookings',
    });
  }

  res.json(booking);
});
