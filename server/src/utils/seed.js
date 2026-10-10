/* Seeds a demo dataset so the app is explorable straight after install.
   Run with:  npm run seed        (this wipes the collections it touches) */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Pet = require('../models/Pet');
const Vaccination = require('../models/Vaccination');
const HealthRecord = require('../models/HealthRecord');
const ServiceProvider = require('../models/ServiceProvider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const QrScan = require('../models/QrScan');

const { addDays } = require('./dates');

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'];
const weekly = (days = WEEK, slots = SLOTS) => days.map((day) => ({ day, slots }));

async function run() {
  await connectDB();
  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}), Pet.deleteMany({}), Vaccination.deleteMany({}), HealthRecord.deleteMany({}),
    ServiceProvider.deleteMany({}), Service.deleteMany({}), Booking.deleteMany({}), Review.deleteMany({}),
    Notification.deleteMany({}), QrScan.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Milo & Tails Admin', email: 'admin@miloandtails.com', password: 'admin123', role: 'admin', city: 'Chennai',
  });

  const [priya, arjun] = await User.create([
    { name: 'Priya Raman', email: 'priya@example.com', password: 'owner123', role: 'owner', phone: '+91 98400 11223', city: 'Chennai' },
    { name: 'Arjun Menon', email: 'arjun@example.com', password: 'owner123', role: 'owner', phone: '+91 98400 44556', city: 'Chennai' },
  ]);

  const providerUsers = await User.create([
    { name: 'Dr. Kavitha Nair', email: 'vet@example.com', password: 'provider123', role: 'provider', phone: '+91 90000 10001', city: 'Chennai' },
    { name: 'Rahul Das', email: 'groomer@example.com', password: 'provider123', role: 'provider', phone: '+91 90000 10002', city: 'Chennai' },
    { name: 'Sneha Iyer', email: 'boarding@example.com', password: 'provider123', role: 'provider', phone: '+91 90000 10003', city: 'Coimbatore' },
    { name: 'Vikram Shetty', email: 'sitter@example.com', password: 'provider123', role: 'provider', phone: '+91 90000 10004', city: 'Chennai' },
  ]);

  const providers = await ServiceProvider.create([
    {
      user: providerUsers[0]._id, businessName: 'Paws & Care Veterinary Clinic',
      categories: ['Veterinary Consultation'], description: 'Small-animal clinic with in-house diagnostics, vaccination clinics and evening consultations.',
      experienceYears: 12, city: 'Chennai', address: 'Anna Nagar, Chennai', phone: '+91 90000 10001',
      handlesAnimalTypes: ['Dog', 'Cat', 'Rabbit', 'Bird'], handlesSizes: ['Small', 'Medium', 'Large'],
      priceFrom: 600, availability: weekly(), status: 'verified', rating: { average: 4.8, count: 24 }, completedBookings: 24,
    },
    {
      user: providerUsers[1]._id, businessName: 'Fluff Studio Grooming',
      categories: ['Pet Grooming'], description: 'Full-service grooming: bath, de-shedding, breed cuts and nail trims. Comfortable with anxious dogs.',
      experienceYears: 6, city: 'Chennai', address: 'Adyar, Chennai', phone: '+91 90000 10002',
      handlesAnimalTypes: ['Dog', 'Cat'], handlesSizes: ['Small', 'Medium', 'Large'],
      priceFrom: 800, availability: weekly(['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']), status: 'verified',
      rating: { average: 4.5, count: 16 }, completedBookings: 16,
    },
    {
      user: providerUsers[2]._id, businessName: 'Happy Tails Boarding',
      categories: ['Pet Boarding', 'Pet Sitting'], description: 'Home-style boarding with daily photo updates and supervised play time.',
      experienceYears: 4, city: 'Coimbatore', address: 'RS Puram, Coimbatore', phone: '+91 90000 10003',
      handlesAnimalTypes: ['Dog', 'Cat'], handlesSizes: ['Small', 'Medium'],
      priceFrom: 500, availability: weekly(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']), status: 'verified',
      rating: { average: 4.2, count: 9 }, completedBookings: 9,
    },
    {
      user: providerUsers[3]._id, businessName: 'City Paws Pet Sitting',
      categories: ['Pet Sitting'], description: 'In-home sitting visits for owners who travel. Awaiting admin verification.',
      experienceYears: 3, city: 'Chennai', address: 'Velachery, Chennai', phone: '+91 90000 10004',
      handlesAnimalTypes: ['Dog', 'Cat'], handlesSizes: ['Small', 'Medium'],
      priceFrom: 450, availability: weekly(['Mon', 'Wed', 'Fri', 'Sat']), status: 'pending',
    },
  ]);

  const services = await Service.create([
    { provider: providers[0]._id, title: 'General health consultation', category: 'Veterinary Consultation', description: 'Full physical check-up with weight, temperature and coat assessment.', price: 600, durationMins: 30, animalTypes: ['Dog', 'Cat', 'Rabbit', 'Bird'] },
    { provider: providers[0]._id, title: 'Vaccination visit', category: 'Veterinary Consultation', description: 'Core and booster vaccinations with an updated passport entry.', price: 950, durationMins: 30, animalTypes: ['Dog', 'Cat'] },
    { provider: providers[1]._id, title: 'Full grooming — small & medium dogs', category: 'Pet Grooming', description: 'Bath, blow dry, breed-standard trim, ear clean and nail trim.', price: 1200, durationMins: 90, animalTypes: ['Dog'] },
    { provider: providers[1]._id, title: 'Cat grooming & de-shedding', category: 'Pet Grooming', description: 'Gentle handling, de-shed treatment and nail trim.', price: 900, durationMins: 60, animalTypes: ['Cat'] },
    { provider: providers[2]._id, title: 'Overnight boarding', category: 'Pet Boarding', description: 'Per-night boarding including meals, walks and photo updates.', price: 700, durationMins: 1440, animalTypes: ['Dog', 'Cat'] },
    { provider: providers[2]._id, title: 'Day pet sitting at your home', category: 'Pet Sitting', description: 'Six hours of in-home care, feeding and companionship.', price: 500, durationMins: 360, animalTypes: ['Dog', 'Cat'] },
  ]);

  const pets = await Pet.create([
    {
      owner: priya._id, name: 'Milo', animalType: 'Dog', breed: 'Golden Retriever',
      dob: addDays(new Date(), -365 * 3), gender: 'Male', size: 'Large', weightKg: 31.2,
      description: 'Friendly golden retriever, wears a red collar, responds to his name.',
      medicalWarning: 'Allergic to chicken protein. Do not feed chicken-based treats.',
      publicProfile: { showBreed: true, showDescription: true, showMedicalWarning: true, showOwnerName: true, showOwnerPhone: false },
      weightHistory: [
        { weightKg: 24.0, date: addDays(new Date(), -330) }, { weightKg: 26.5, date: addDays(new Date(), -240) },
        { weightKg: 28.9, date: addDays(new Date(), -150) }, { weightKg: 30.4, date: addDays(new Date(), -60) },
        { weightKg: 31.2, date: addDays(new Date(), -7) },
      ],
    },
    {
      owner: priya._id, name: 'Tofu', animalType: 'Cat', breed: 'Indian Shorthair',
      dob: addDays(new Date(), -365 * 2), gender: 'Female', size: 'Small', weightKg: 4.1,
      description: 'Grey tabby, slightly shy with strangers.',
      weightHistory: [
        { weightKg: 3.4, date: addDays(new Date(), -300) }, { weightKg: 3.8, date: addDays(new Date(), -180) },
        { weightKg: 4.1, date: addDays(new Date(), -20) },
      ],
    },
    {
      owner: arjun._id, name: 'Coco', animalType: 'Dog', breed: 'Beagle',
      dob: addDays(new Date(), -365), gender: 'Female', size: 'Medium', weightKg: 11.4,
      description: 'Energetic beagle who loves long walks.',
      weightHistory: [{ weightKg: 8.2, date: addDays(new Date(), -200) }, { weightKg: 11.4, date: addDays(new Date(), -15) }],
    },
  ]);

  await Vaccination.create([
    { pet: pets[0]._id, createdBy: priya._id, name: 'Rabies', givenOn: addDays(new Date(), -300), nextDueDate: addDays(new Date(), 65), vetName: 'Dr. Kavitha Nair', batchNo: 'RB-4471' },
    { pet: pets[0]._id, createdBy: priya._id, name: 'DHPP booster', givenOn: addDays(new Date(), -180), nextDueDate: addDays(new Date(), 12), vetName: 'Dr. Kavitha Nair', batchNo: 'DH-2210' },
    { pet: pets[1]._id, createdBy: priya._id, name: 'Feline Rabies', givenOn: addDays(new Date(), -400), nextDueDate: addDays(new Date(), -35), vetName: 'Dr. Kavitha Nair' },
    { pet: pets[2]._id, createdBy: arjun._id, name: 'Rabies', givenOn: addDays(new Date(), -120), nextDueDate: addDays(new Date(), 245), vetName: 'Dr. Kavitha Nair' },
  ]);

  await HealthRecord.create([
    { pet: pets[0]._id, createdBy: priya._id, type: 'Allergy', title: 'Chicken protein allergy', description: 'Causes itching and ear inflammation. Confirmed by elimination diet.', date: addDays(new Date(), -280), severity: 'Moderate' },
    { pet: pets[0]._id, createdBy: priya._id, type: 'Vet Visit', title: 'Annual health check', description: 'All vitals normal. Advised joint supplement.', date: addDays(new Date(), -60), vetName: 'Dr. Kavitha Nair', clinic: 'Paws & Care Veterinary Clinic' },
    { pet: pets[0]._id, createdBy: priya._id, type: 'Medication', title: 'Joint supplement (glucosamine)', description: 'Given with the morning meal.', date: addDays(new Date(), -55), medication: { dosage: '1 tablet', frequency: 'Once daily', startDate: addDays(new Date(), -55), endDate: addDays(new Date(), 25), isActive: true } },
    { pet: pets[1]._id, createdBy: priya._id, type: 'Condition', title: 'Mild dental tartar', description: 'Recheck in six months. Dental treats recommended.', date: addDays(new Date(), -90), severity: 'Low', vetName: 'Dr. Kavitha Nair' },
  ]);

  const bookings = await Booking.create([
    { owner: priya._id, pet: pets[0]._id, provider: providers[0]._id, service: services[0]._id, date: addDays(new Date(), -60), timeSlot: '10:00 - 11:00', price: 600, status: 'Completed', completedAt: addDays(new Date(), -60) },
    { owner: priya._id, pet: pets[0]._id, provider: providers[1]._id, service: services[2]._id, date: addDays(new Date(), -20), timeSlot: '11:00 - 12:00', price: 1200, status: 'Completed', completedAt: addDays(new Date(), -20) },
    { owner: priya._id, pet: pets[0]._id, provider: providers[0]._id, service: services[1]._id, date: addDays(new Date(), 12), timeSlot: '09:00 - 10:00', price: 950, status: 'Accepted', notes: 'DHPP booster due.' },
    { owner: priya._id, pet: pets[1]._id, provider: providers[1]._id, service: services[3]._id, date: addDays(new Date(), 5), timeSlot: '16:00 - 17:00', price: 900, status: 'Requested', notes: 'She is nervous around dryers.' },
    { owner: arjun._id, pet: pets[2]._id, provider: providers[2]._id, service: services[4]._id, date: addDays(new Date(), 9), timeSlot: '09:00 - 10:00', price: 700, status: 'Requested' },
  ]);

  await Review.create([
    { booking: bookings[0]._id, provider: providers[0]._id, owner: priya._id, pet: pets[0]._id, rating: 5, comment: 'Dr. Nair explained everything clearly and Milo was completely relaxed through the check-up.' },
    { booking: bookings[1]._id, provider: providers[1]._id, owner: priya._id, pet: pets[0]._id, rating: 4, comment: 'Great cut and very patient with a big dog. Ran about fifteen minutes late.' },
  ]);
  await Booking.updateMany({ _id: { $in: [bookings[0]._id, bookings[1]._id] } }, { isReviewed: true });
  await Review.recalculateProviderRating(providers[0]._id);
  await Review.recalculateProviderRating(providers[1]._id);

  await QrScan.create({
    pet: pets[0]._id, hasLocation: true, latitude: 13.0827, longitude: 80.2707, accuracyMeters: 18,
    finderName: 'Ravi', finderContact: '+91 99999 88888', message: 'Found him near the park gate, he is safe with me.',
  });

  console.log('\nSeed complete. Demo accounts:');
  console.table([
    { role: 'Admin', email: admin.email, password: 'admin123' },
    { role: 'Pet owner', email: priya.email, password: 'owner123' },
    { role: 'Pet owner', email: arjun.email, password: 'owner123' },
    { role: 'Provider (vet, verified)', email: providerUsers[0].email, password: 'provider123' },
    { role: 'Provider (grooming, verified)', email: providerUsers[1].email, password: 'provider123' },
    { role: 'Provider (boarding, verified)', email: providerUsers[2].email, password: 'provider123' },
    { role: 'Provider (sitting, pending)', email: providerUsers[3].email, password: 'provider123' },
  ]);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
