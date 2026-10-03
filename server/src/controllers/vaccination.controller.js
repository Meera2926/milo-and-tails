const asyncHandler = require('../middleware/asyncHandler');
const Vaccination = require('../models/Vaccination');
const Pet = require('../models/Pet');
const { toFileMeta } = require('../middleware/upload');

async function assertPetAccess(petId, user) {
  const pet = await Pet.findById(petId);
  if (!pet) {
    const err = new Error('Pet not found');
    err.status = 404;
    throw err;
  }
  const isOwner = String(pet.owner) === String(user._id);
  if (!isOwner && user.role !== 'admin' && user.role !== 'provider') {
    const err = new Error('This pet belongs to another owner');
    err.status = 403;
    throw err;
  }
  return pet;
}

// GET /api/vaccinations/pet/:petId
exports.listForPet = asyncHandler(async (req, res) => {
  await assertPetAccess(req.params.petId, req.user);
  const all = await Vaccination.find({ pet: req.params.petId }).sort('-givenOn');
  const now = new Date();
  res.json({
    all,
    completed: all,
    upcoming: all
      .filter((v) => v.nextDueDate && new Date(v.nextDueDate) >= now)
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)),
    overdue: all.filter((v) => v.nextDueDate && new Date(v.nextDueDate) < now),
  });
});

// POST /api/vaccinations/pet/:petId
exports.create = asyncHandler(async (req, res) => {
  await assertPetAccess(req.params.petId, req.user);
  const body = { ...req.body, pet: req.params.petId, createdBy: req.user._id };
  if (req.file) {
    const meta = toFileMeta(req.file);
    body.document = { url: meta.url, name: meta.name };
  }
  const vaccination = await Vaccination.create(body);
  res.status(201).json(vaccination);
});

// PUT /api/vaccinations/:id
exports.update = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id);
  if (!vaccination) {
    res.status(404);
    throw new Error('Vaccination record not found');
  }
  await assertPetAccess(vaccination.pet, req.user);
  ['name', 'givenOn', 'nextDueDate', 'vetName', 'batchNo', 'notes'].forEach((f) => {
    if (req.body[f] !== undefined) vaccination[f] = req.body[f];
  });
  if (req.file) {
    const meta = toFileMeta(req.file);
    vaccination.document = { url: meta.url, name: meta.name };
  }
  await vaccination.save();
  res.json(vaccination);
});

// DELETE /api/vaccinations/:id
exports.remove = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id);
  if (!vaccination) {
    res.status(404);
    throw new Error('Vaccination record not found');
  }
  await assertPetAccess(vaccination.pet, req.user);
  await vaccination.deleteOne();
  res.json({ message: 'Vaccination record deleted' });
});
