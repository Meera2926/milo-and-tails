const asyncHandler = require('../middleware/asyncHandler');
const HealthRecord = require('../models/HealthRecord');
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
  // Vets can add records to a pet they have treated; admins can read everything.
  if (!isOwner && user.role !== 'admin' && user.role !== 'provider') {
    const err = new Error('This pet belongs to another owner');
    err.status = 403;
    throw err;
  }
  return pet;
}

// GET /api/health-records/pet/:petId
exports.listForPet = asyncHandler(async (req, res) => {
  await assertPetAccess(req.params.petId, req.user);
  const filter = { pet: req.params.petId };
  if (req.query.type) filter.type = req.query.type;
  const records = await HealthRecord.find(filter).sort('-date');
  res.json(records);
});

// POST /api/health-records/pet/:petId
exports.create = asyncHandler(async (req, res) => {
  await assertPetAccess(req.params.petId, req.user);
  const body = { ...req.body, pet: req.params.petId, createdBy: req.user._id };
  if (typeof body.medication === 'string') body.medication = JSON.parse(body.medication);
  if (req.files?.length) body.attachments = req.files.map(toFileMeta);
  const record = await HealthRecord.create(body);
  res.status(201).json(record);
});

// PUT /api/health-records/:id
exports.update = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Health record not found');
  }
  await assertPetAccess(record.pet, req.user);
  const fields = ['type', 'title', 'description', 'date', 'vetName', 'clinic', 'severity'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f];
  });
  if (req.body.medication !== undefined) {
    record.medication = typeof req.body.medication === 'string' ? JSON.parse(req.body.medication) : req.body.medication;
  }
  if (req.files?.length) record.attachments.push(...req.files.map(toFileMeta));
  await record.save();
  res.json(record);
});

// DELETE /api/health-records/:id
exports.remove = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Health record not found');
  }
  await assertPetAccess(record.pet, req.user);
  await record.deleteOne();
  res.json({ message: 'Record deleted' });
});
