const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

const dayKey = (d) => DAY_KEYS[new Date(d).getDay()];

const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

module.exports = { startOfDay, endOfDay, addDays, daysBetween, dayKey, sameDay, DAY_KEYS };
