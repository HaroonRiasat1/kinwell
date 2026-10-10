// Urdu labels the server writes itself. Machine-assisted: have a native speaker review.
export default {
  words: {
    Breakfast: 'ناشتہ',
    Lunch: 'دوپہر کا کھانا',
    Dinner: 'رات کا کھانا',
    Snack: 'ہلکا ناشتہ',
    London: 'لندن',
    Dubai: 'دبئی',
    Toronto: 'ٹورنٹو',
    Riyadh: 'ریاض',
    Houston: 'ہیوسٹن',
    Manchester: 'مانچسٹر',
    Lahore: 'لاہور',
  },
  // 11 → "صبح 11 بجے", 16:30 → "شام 4:30 بجے"
  clock(hour24, minutes) {
    const part = hour24 < 5 ? 'رات' : hour24 < 12 ? 'صبح' : hour24 < 16 ? 'دوپہر' : hour24 < 19 ? 'شام' : 'رات';
    const h = hour24 % 12 || 12;
    const m = Number(minutes) ? `:${String(minutes).padStart(2, '0')}` : '';
    return `${part} ${h}${m} بجے`;
  },
  relative(n) {
    if (n <= 0) return 'آج';
    if (n === 1) return 'کل';
    return `${n} دن میں`;
  },
};
