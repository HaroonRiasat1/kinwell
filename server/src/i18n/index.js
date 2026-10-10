// Server-side localisation: which languages exist, how to pick one per request,
// and how to format the few labels the server writes itself (dates, slots, cities).
// To add a language: add it to LANGUAGES, add a labels file, and add content
// translations in shared/i18n/<lang>.js.
import { CARE_TIMEZONE } from '../utils/time.js';
import ur from './labels.ur.js';

export const LANGUAGES = ['en', 'ur'];
export const DEFAULT_LANGUAGE = 'en';
const LABELS = { ur };
const LOCALE = { en: 'en-GB', ur: 'ur-PK-u-nu-latn' };

export const pickLanguage = (value) => {
  const code = String(value ?? '').toLowerCase().split(/[-_,;]/)[0];
  return LANGUAGES.includes(code) ? code : null;
};

/** A fixed label (meal slot, city…) in `lang`, falling back to the English source. */
export const label = (text, lang) => LABELS[lang]?.words?.[text] ?? text;

/**
 * A translated field from a document's `i18n` map, e.g. localized(supp, 'simple', 'ur').
 * Falls back to the original field when there is no translation.
 */
export function localized(doc, field, lang) {
  if (!doc || lang === DEFAULT_LANGUAGE) return doc?.[field];
  const t = doc.i18n?.get?.(lang) ?? doc.i18n?.[lang];
  return t?.[field] ?? doc[field];
}

const fmt = (date, lang, opts) =>
  new Intl.DateTimeFormat(LOCALE[lang] ?? LOCALE.en, { timeZone: CARE_TIMEZONE, ...opts }).format(date).replace('Sept', 'Sep');

const hourIn = (date) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: CARE_TIMEZONE, hour: 'numeric', hour12: false }).format(date));

function clock(date, lang) {
  if (lang === 'ur') return LABELS.ur.clock(hourIn(date), fmt(date, 'en', { minute: '2-digit' }));
  return fmt(date, 'en', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').toLowerCase().replace(/\s?(am|pm)/, ' $1');
}

/** "Monday, 12 October at 11 am" / "پیر، 12 اکتوبر، صبح 11 بجے" */
export function visitDateTime(date, lang = 'en') {
  const day = `${fmt(date, lang, { weekday: 'long' })}، ${fmt(date, lang, { day: 'numeric', month: 'long' })}`;
  if (lang === 'ur') return { date: day, time: clock(date, lang), full: `${day}، ${clock(date, lang)}` };
  const d = `${fmt(date, lang, { weekday: 'long' })}, ${fmt(date, lang, { day: 'numeric', month: 'long' })}`;
  return { date: d, time: clock(date, lang), full: `${d} at ${clock(date, lang)}` };
}

/** "Mon 28 Sep" / "28 ستمبر" */
export const dayLabel = (date, lang = 'en') =>
  lang === 'ur' ? fmt(date, lang, { day: 'numeric', month: 'long' }) : `${fmt(date, lang, { weekday: 'short' })} ${fmt(date, lang, { day: 'numeric', month: 'short' })}`;

/** "Today" / "Tomorrow" / "In 3 days" */
export function relativeDaysLabel(n, lang = 'en') {
  if (lang === 'ur') return LABELS.ur.relative(n);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `In ${n} days`;
}
