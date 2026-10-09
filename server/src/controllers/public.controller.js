const asyncHandler = require('../middleware/asyncHandler');
const Pet = require('../models/Pet');
const QrScan = require('../models/QrScan');
const HealthRecord = require('../models/HealthRecord');
const notify = require('../utils/notify');

// GET /api/public/pet/:token
// Open to anyone who scans the collar tag. Returns only what the owner chose to share.
exports.lostPetProfile = asyncHandler(async (req, res) => {
  const pet = await Pet.findOne({ qrToken: req.params.token }).populate('owner', 'name phone city');
  if (!pet) {
    res.status(404);
    throw new Error('This tag is not registered with Milo & Tails');
  }

  const pp = pet.publicProfile || {};
  const allergies = pp.showMedicalWarning
    ? await HealthRecord.find({ pet: pet._id, type: 'Allergy' }).select('title severity').limit(5)
    : [];

  // Record the scan itself. No location unless the finder explicitly shares it.
  const scan = await QrScan.create({
    pet: pet._id,
    hasLocation: false,
    userAgent: (req.headers['user-agent'] || '').slice(0, 300),
  });

  if (pet.isLost) {
    await notify(pet.owner._id, {
      type: 'qr-scan',
      title: `${pet.name}'s tag was just scanned`,
      message: 'Someone opened the lost-pet page. You will be alerted again if they share a location.',
      link: `/owner/pets/${pet._id}?tab=tag`,
    });
  }

  res.json({
    scanId: scan._id,
    pet: {
      name: pet.name,
      photo: pet.photo,
      animalType: pet.animalType,
      gender: pet.gender,
      ageText: pet.ageText,
      isLost: pet.isLost,
      breed: pp.showBreed ? pet.breed : undefined,
      description: pp.showDescription ? pet.description : undefined,
      medicalWarning: pp.showMedicalWarning ? pet.medicalWarning : undefined,
      allergies: allergies.map((a) => ({ title: a.title, severity: a.severity })),
    },
    owner: {
      // Contact details stay hidden unless the owner opted in. The
      // "Contact owner" button always works via the in-app alert instead.
      name: pp.showOwnerName ? pet.owner.name : undefined,
      phone: pp.showOwnerPhone ? pet.owner.phone : undefined,
      city: pet.owner.city,
    },
  });
});

// POST /api/public/pet/:token/found
// Called only after the finder presses "Share found location" and the browser grants permission.
exports.reportFound = asyncHandler(async (req, res) => {
  const { latitude, longitude, accuracyMeters, finderName, finderContact, message, scanId } = req.body;

  const pet = await Pet.findOne({ qrToken: req.params.token }).populate('owner', 'name');
  if (!pet) {
    res.status(404);
    throw new Error('This tag is not registered with Milo & Tails');
  }

  const hasLocation = latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null;
  if (hasLocation && (Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180)) {
    res.status(400);
    throw new Error('Those coordinates are not valid');
  }

  const payload = {
    hasLocation,
    finderName,
    finderContact,
    message,
    ...(hasLocation
      ? { latitude: Number(latitude), longitude: Number(longitude), accuracyMeters: Number(accuracyMeters) || undefined }
      : {}),
  };

  const scan = scanId
    ? await QrScan.findOneAndUpdate({ _id: scanId, pet: pet._id }, payload, { new: true })
    : null;
  const record = scan || (await QrScan.create({ pet: pet._id, ...payload }));

  await notify(pet.owner._id, {
    type: 'qr-scan',
    title: hasLocation ? `Someone found ${pet.name} and shared a location` : `Someone contacted you about ${pet.name}`,
    message: [
      finderName ? `From ${finderName}` : 'From an anonymous finder',
      finderContact ? `· ${finderContact}` : '',
      message ? `· "${message}"` : '',
    ]
      .filter(Boolean)
      .join(' '),
    link: `/owner/pets/${pet._id}?tab=tag`,
  });

  res.status(201).json({
    message: hasLocation
      ? `Thank you. ${pet.name}'s owner has been alerted with this location.`
      : `Thank you. ${pet.name}'s owner has been alerted.`,
    scanId: record._id,
  });
});
