const QRCode = require('qrcode');
const asyncHandler = require('../middleware/asyncHandler');
const Pet = require('../models/Pet');
const HealthRecord = require('../models/HealthRecord');
const Vaccination = require('../models/Vaccination');
const Booking = require('../models/Booking');
const QrScan = require('../models/QrScan');
const { toFileMeta } = require('../middleware/upload');
const { addDays, daysBetween } = require('../utils/dates');

// Owners may only touch their own pets; admins can read any pet.
async function loadOwnedPet(req, { allowAdmin = true } = {}) {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    const err = new Error('Pet not found');
    err.status = 404;
    throw err;
  }
  const isOwner = String(pet.owner) === String(req.user._id);
  const isAdmin = allowAdmin && req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    const err = new Error('This pet belongs to another owner');
    err.status = 403;
    throw err;
  }
  return pet;
}
exports.loadOwnedPet = loadOwnedPet;

// GET /api/pets
exports.listMyPets = asyncHandler(async (req, res) => {
  const pets = await Pet.find({ owner: req.user._id, isArchived: false }).sort('-createdAt');
  res.json(pets);
});

// GET /api/pets/:id
exports.getPet = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req);
  res.json(pet);
});

// POST /api/pets
exports.createPet = asyncHandler(async (req, res) => {
  const body = { ...req.body, owner: req.user._id };
  if (req.file) body.photo = toFileMeta(req.file).url;
  if (body.publicProfile && typeof body.publicProfile === 'string') {
    body.publicProfile = JSON.parse(body.publicProfile);
  }
  const pet = await Pet.create(body);
  if (pet.weightKg) {
    pet.weightHistory.push({ weightKg: pet.weightKg, date: new Date(), note: 'Starting weight' });
    await pet.save();
  }
  res.status(201).json(pet);
});

// PUT /api/pets/:id
exports.updatePet = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req, { allowAdmin: false });
  const fields = ['name', 'animalType', 'breed', 'dob', 'gender', 'size', 'description', 'medicalWarning', 'isLost'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) pet[f] = req.body[f];
  });
  if (req.body.publicProfile !== undefined) {
    const pp = typeof req.body.publicProfile === 'string' ? JSON.parse(req.body.publicProfile) : req.body.publicProfile;
    pet.publicProfile = { ...pet.publicProfile.toObject(), ...pp };
  }
  if (req.file) pet.photo = toFileMeta(req.file).url;
  await pet.save();
  res.json(pet);
});

// DELETE /api/pets/:id
exports.deletePet = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req, { allowAdmin: false });
  await Promise.all([
    HealthRecord.deleteMany({ pet: pet._id }),
    Vaccination.deleteMany({ pet: pet._id }),
    QrScan.deleteMany({ pet: pet._id }),
  ]);
  await pet.deleteOne();
  res.json({ message: `${pet.name}'s profile was removed` });
});

// POST /api/pets/:id/weight
exports.addWeight = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req, { allowAdmin: false });
  const { weightKg, date, note } = req.body;
  if (!weightKg || Number(weightKg) <= 0) {
    res.status(400);
    throw new Error('Enter a weight greater than 0 kg');
  }
  pet.weightHistory.push({ weightKg: Number(weightKg), date: date || new Date(), note });
  pet.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
  pet.weightKg = pet.weightHistory[pet.weightHistory.length - 1].weightKg;
  await pet.save();
  res.status(201).json(pet);
});

// DELETE /api/pets/:id/weight/:entryId
exports.deleteWeight = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req, { allowAdmin: false });
  pet.weightHistory = pet.weightHistory.filter((w) => String(w._id) !== req.params.entryId);
  pet.weightKg = pet.weightHistory.length ? pet.weightHistory[pet.weightHistory.length - 1].weightKg : undefined;
  await pet.save();
  res.json(pet);
});

// GET /api/pets/:id/dashboard  — everything the growth & health dashboard needs
exports.petDashboard = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req);
  const now = new Date();
  const soon = addDays(now, 30);

  const [vaccinations, records, bookings, scans] = await Promise.all([
    Vaccination.find({ pet: pet._id }).sort('-givenOn'),
    HealthRecord.find({ pet: pet._id }).sort('-date'),
    Booking.find({ pet: pet._id })
      .populate('provider', 'businessName city rating')
      .populate('service', 'title category price')
      .sort('-date'),
    QrScan.find({ pet: pet._id }).sort('-createdAt').limit(10),
  ]);

  const upcomingVaccinations = vaccinations
    .filter((v) => v.nextDueDate && new Date(v.nextDueDate) >= now)
    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  const overdueVaccinations = vaccinations.filter((v) => v.nextDueDate && new Date(v.nextDueDate) < now);
  const activeMedications = records.filter((r) => r.type === 'Medication' && r.medication?.isActive);

  const upcomingBookings = bookings.filter(
    (b) => ['Requested', 'Accepted'].includes(b.status) && new Date(b.date) >= new Date(now.toDateString())
  );

  // A simple, explainable health status the UI can colour-code
  let healthStatus = 'Good';
  const alerts = [];
  if (overdueVaccinations.length) {
    healthStatus = 'Needs attention';
    alerts.push(`${overdueVaccinations.length} vaccination(s) overdue`);
  }
  if (records.some((r) => r.type === 'Condition' && r.severity === 'High')) {
    healthStatus = 'Needs attention';
    alerts.push('An ongoing high-severity condition is recorded');
  }
  if (!vaccinations.length) {
    healthStatus = healthStatus === 'Good' ? 'Incomplete' : healthStatus;
    alerts.push('No vaccinations recorded yet');
  }

  res.json({
    pet,
    healthStatus,
    alerts,
    weightHistory: pet.weightHistory,
    currentWeight: pet.weightKg || null,
    vaccinations,
    upcomingVaccinations,
    overdueVaccinations,
    dueWithin30Days: upcomingVaccinations.filter((v) => new Date(v.nextDueDate) <= soon),
    activeMedications,
    allergies: records.filter((r) => r.type === 'Allergy'),
    conditions: records.filter((r) => r.type === 'Condition'),
    recentEvents: records.slice(0, 5),
    upcomingBookings,
    serviceHistory: bookings.filter((b) => b.status === 'Completed'),
    recentScans: scans,
    daysToNextVaccination: upcomingVaccinations.length
      ? daysBetween(now, upcomingVaccinations[0].nextDueDate)
      : null,
  });
});

// GET /api/pets/:id/timeline — merged, chronological care history
exports.petTimeline = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req);
  const [records, vaccinations, bookings] = await Promise.all([
    HealthRecord.find({ pet: pet._id }),
    Vaccination.find({ pet: pet._id }),
    Booking.find({ pet: pet._id }).populate('provider', 'businessName').populate('service', 'title category'),
  ]);

  const events = [];
  records.forEach((r) =>
    events.push({
      id: String(r._id),
      kind: r.type === 'Medication' ? 'medication' : 'health',
      category: r.type,
      title: r.title,
      detail: r.description || r.vetName || '',
      date: r.date,
    })
  );
  vaccinations.forEach((v) =>
    events.push({
      id: String(v._id),
      kind: 'vaccination',
      category: 'Vaccination',
      title: v.name,
      detail: v.nextDueDate ? `Next due ${new Date(v.nextDueDate).toLocaleDateString()}` : v.vetName || '',
      date: v.givenOn,
    })
  );
  bookings
    .filter((b) => ['Accepted', 'Completed'].includes(b.status))
    .forEach((b) =>
      events.push({
        id: String(b._id),
        kind: 'service',
        category: b.service?.category || 'Service',
        title: b.service?.title || 'Service booking',
        detail: `${b.provider?.businessName || 'Provider'} · ${b.status}`,
        date: b.date,
      })
    );
  pet.weightHistory.forEach((w) =>
    events.push({
      id: String(w._id),
      kind: 'weight',
      category: 'Weight update',
      title: `${w.weightKg} kg`,
      detail: w.note || '',
      date: w.date,
    })
  );

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ pet: { _id: pet._id, name: pet.name, photo: pet.photo }, events });
});

// GET /api/pets/:id/qr — data URL for printing the collar tag
exports.getPetQr = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req);
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  const url = `${base}/found/${pet.qrToken}`;
  const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: 'H' });
  res.json({ url, dataUrl, token: pet.qrToken, petName: pet.name });
});

// POST /api/pets/:id/qr/regenerate — invalidates a lost or copied tag
exports.regenerateQr = asyncHandler(async (req, res) => {
  const crypto = require('crypto');
  const pet = await loadOwnedPet(req, { allowAdmin: false });
  pet.qrToken = crypto.randomBytes(8).toString('hex');
  await pet.save();
  res.json({ token: pet.qrToken, message: 'New tag created. Print and replace the old one.' });
});

// GET /api/pets/:id/scans
exports.petScans = asyncHandler(async (req, res) => {
  const pet = await loadOwnedPet(req);
  const scans = await QrScan.find({ pet: pet._id }).sort('-createdAt');
  res.json(scans);
});
