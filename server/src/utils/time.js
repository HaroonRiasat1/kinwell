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

const DAY_MS = 24 * 3600 * 1000;
const fmt = (date, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: CARE_TIMEZONE, ...opts }).format(date).replace('Sept', 'Sep');

/** Lahore calendar dates (YYYY-MM-DD) for Monday…Sunday of the current week. */
export const weekDateKeys = (now = new Date()) =>
  Array.from({ length: 7 }, (_, i) => todayKey(new Date(now.getTime() + (i - weekdayIndex(now)) * DAY_MS)));

export const dateKeyDaysAgo = (n, now = new Date()) => todayKey(new Date(now.getTime() - n * DAY_MS));

/** Whole Lahore calendar days from today until `date` (0 = today). */
export function calendarDaysUntil(date, now = new Date()) {
  const toUtc = (k) => Date.UTC(...k.split('-').map((x, i) => (i === 1 ? Number(x) - 1 : Number(x))));
  return Math.round((toUtc(todayKey(date)) - toUtc(todayKey(now))) / DAY_MS);
}

const clock = (date) => {
  const t = fmt(date, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').toLowerCase();
  return t.replace(/\s?(am|pm)/, ' $1');
};

// "Mon 12 Oct, 11 am"
export const shortVisitLabel = (date) => `${fmt(date, { weekday: 'short' })} ${fmt(date, { day: 'numeric', month: 'short' })}, ${clock(date)}`;
// "Monday, 12 October at 11 am"
export const longVisitLabel = (date) => `${fmt(date, { weekday: 'long' })}, ${fmt(date, { day: 'numeric', month: 'long' })} at ${clock(date)}`;
// "Mon 28 Sep"
export const shortDayLabel = (date) => `${fmt(date, { weekday: 'short' })} ${fmt(date, { day: 'numeric', month: 'short' })}`;

export function relativeDays(n) {
  if (n <= 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}

/** "2026-10-12" + "11:00 am" → that moment in Lahore (UTC+5, no daylight saving). */
export function lahoreDateTime(dateKey, clock = '9:00 am') {
  const [, h, m = '00', ap] = String(clock).match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i) ?? [null, '9', '00', 'am'];
  const hour = (Number(h) % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0);
  return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${m}:00+05:00`);
}

/** "Monday 12 October" (no year) → "2026-10-12", choosing the next such date from now. */
export function dateKeyFromLabel(label, now = new Date()) {
  const m = String(label).match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (!m) return null;
  for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
    const t = Date.parse(`${m[1]} ${m[2]} ${year} 12:00`);
    if (!Number.isNaN(t) && t >= now.getTime() - 24 * 3600 * 1000) return todayKey(new Date(t));
  }
  return null;
}
