import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

const toDate = (value) => {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
};

export const fmtDate = (value, pattern = 'd MMM yyyy') => {
  const d = toDate(value);
  return d ? format(d, pattern) : '—';
};

export const fmtDateTime = (value) => fmtDate(value, "d MMM yyyy 'at' h:mm a");

export const fmtRelative = (value) => {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : '';
};

export const toInputDate = (value) => {
  const d = toDate(value);
  return d ? format(d, 'yyyy-MM-dd') : '';
};

export const money = (amount) =>
  typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : '—';

export const fileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

// "in 3 days" / "12 days ago" / "today", used across reminders
export const daysLabel = (days) => {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days overdue`;
};
