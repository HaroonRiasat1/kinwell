// Kinwell's care happens in Lahore, so "today" is always Lahore's calendar day.
export const CARE_TIMEZONE = 'Asia/Karachi';

export const todayKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: CARE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

// Monday = 0 … Sunday = 6, in Lahore time.
export const weekdayIndex = (date = new Date()) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: CARE_TIMEZONE, weekday: 'short' }).format(date);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name);
};

export const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - weekdayIndex(date));
  return d;
};
