const asyncHandler = require('../middleware/asyncHandler');
const Pet = require('../models/Pet');
const Vaccination = require('../models/Vaccination');
const HealthRecord = require('../models/HealthRecord');
const Booking = require('../models/Booking');
const { addDays, daysBetween, startOfDay } = require('../utils/dates');

// GET /api/reminders  — vaccinations, medication and appointments, merged
exports.upcoming = asyncHandler(async (req, res) => {
  const windowDays = Number(req.query.days || 45);
  const today = startOfDay(new Date());
  const until = addDays(today, windowDays);

  const pets = await Pet.find({ owner: req.user._id, isArchived: false }).select('name photo animalType');
  const petIds = pets.map((p) => p._id);
  const petById = new Map(pets.map((p) => [String(p._id), p]));

  const [vaccinations, medications, bookings] = await Promise.all([
    Vaccination.find({ pet: { $in: petIds }, nextDueDate: { $ne: null, $lte: until } }).sort('nextDueDate'),
    HealthRecord.find({ pet: { $in: petIds }, type: 'Medication', 'medication.isActive': true }),
    Booking.find({
      pet: { $in: petIds },
      status: { $in: ['Requested', 'Accepted'] },
      date: { $gte: today, $lte: until },
    })
      .populate('service', 'title category')
      .populate('provider', 'businessName city')
      .sort('date'),
  ]);

  const reminders = [];

  vaccinations.forEach((v) => {
    const days = daysBetween(today, v.nextDueDate);
    reminders.push({
      id: `vac-${v._id}`,
      kind: 'vaccination',
      petId: String(v.pet),
      pet: petById.get(String(v.pet)),
      title: `${v.name} vaccination due`,
      detail: v.vetName ? `Last given by ${v.vetName}` : 'Book a vet visit to keep the schedule on track',
      date: v.nextDueDate,
      daysAway: days,
      urgency: days < 0 ? 'overdue' : days <= 7 ? 'soon' : 'upcoming',
    });
  });

  medications.forEach((m) => {
    const end = m.medication?.endDate;
    const days = end ? daysBetween(today, end) : null;
    if (end && days < 0) return;
    reminders.push({
      id: `med-${m._id}`,
      kind: 'medication',
      petId: String(m.pet),
      pet: petById.get(String(m.pet)),
      title: `${m.title} — ${m.medication?.frequency || 'ongoing'}`,
      detail: m.medication?.dosage ? `Dose: ${m.medication.dosage}` : 'Active medication',
      date: end || today,
      daysAway: days,
      urgency: days !== null && days <= 3 ? 'soon' : 'ongoing',
    });
  });

  bookings.forEach((b) => {
    const days = daysBetween(today, b.date);
    reminders.push({
      id: `bkg-${b._id}`,
      kind: 'appointment',
      petId: String(b.pet),
      pet: petById.get(String(b.pet)),
      title: `${b.service?.title || 'Appointment'} at ${b.provider?.businessName || 'provider'}`,
      detail: `${b.timeSlot} · ${b.status}`,
      date: b.date,
      daysAway: days,
      urgency: days <= 1 ? 'soon' : 'upcoming',
    });
  });

  reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json({
    windowDays,
    overdue: reminders.filter((r) => r.urgency === 'overdue'),
    reminders,
  });
});
