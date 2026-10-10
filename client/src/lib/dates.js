// Kinwell shows dates the way families say them: "Friday, 9 October".
export const longDate = (d = new Date(), locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(d);

export function todayGreeting(d = new Date()) {
  const h = d.getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${longDate(d)} · ${part}`;
}

// Monday = 0 … Sunday = 6
export const weekdayIndex = (d = new Date()) => (d.getDay() + 6) % 7;
