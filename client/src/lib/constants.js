export const SERVICE_CATEGORIES = [
  'Veterinary Consultation',
  'Pet Grooming',
  'Pet Boarding',
  'Pet Sitting',
];

export const ANIMAL_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Other'];
export const SIZES = ['Small', 'Medium', 'Large'];
export const GENDERS = ['Male', 'Female', 'Unknown'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DEFAULT_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
  '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
];

export const HEALTH_RECORD_TYPES = [
  'Vet Visit', 'Treatment', 'Medication', 'Allergy', 'Condition', 'Medical Report', 'Prescription',
];

export const BOOKING_STATUSES = ['Requested', 'Accepted', 'Completed', 'Rejected', 'Cancelled'];

// Booking status -> badge styling. Kept in one place so a status looks
// identical on the owner, provider and admin screens.
export const STATUS_STYLES = {
  Requested: 'bg-marigold-soft text-[#8A5B12]',
  Accepted: 'bg-moss-soft text-moss-deep',
  Completed: 'bg-pine/10 text-pine',
  Rejected: 'bg-coral-soft text-coral',
  Cancelled: 'bg-line text-muted',
};

export const CATEGORY_EMOJI = {
  'Veterinary Consultation': '🩺',
  'Pet Grooming': '✂️',
  'Pet Boarding': '🏠',
  'Pet Sitting': '🧸',
};
