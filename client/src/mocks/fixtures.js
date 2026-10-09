// API-shaped fixtures built from the shared design dataset, so Storybook shows exactly what the
// seeded database returns — without a running server.
import {
  BAND,
  BAND_ABBU,
  BOOK_DAYS,
  BOOK_SLOTS,
  CLIENTS,
  CONTACTS,
  DISHES,
  DOCS,
  FAVOR,
  INTERACT,
  LIB_SUPPS,
  MARKER_NAMES,
  MEANING,
  MONTHS,
  MSGS,
  NUTS,
  PARENTS,
  PEOPLE,
  PROFILE,
  REPORTS,
  SUPPX,
  VISITS,
  WEEK,
} from '@kinwell/shared';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const TIMES = ['8:00 am', '1:30 pm', '8:00 pm', '5:00 pm'];

export const HINA = { id: 'hina', name: 'Hina Qureshi', credential: 'Registered dietitian · 9 years', languages: 'Urdu, Punjabi, English' };
export const SANA = { id: 'sana', name: 'Sana Rahman', role: 'family', city: 'London' };
export const HINA_USER = { id: 'hina', name: 'Hina Qureshi', role: 'nutritionist', city: 'Lahore', nutritionist: { areas: ['Model Town', 'Gulberg', 'Johar Town'] } };
export const ZARA = { id: 'zara', name: 'Zara Ahmed', role: 'admin', city: 'Lahore' };

export const parentSummary = (key) => {
  const P = PARENTS[key];
  return { id: key, key, short: P.short, fullName: PROFILE[key].full, age: P.age, city: P.city, area: 'Model Town', overall: P.overall };
};
export const parents = ['ammi', 'abbu'].map(parentSummary);

const markers = (key) =>
  PARENTS[key].markers.map((m) => ({
    id: m.name,
    ...m,
    months: MONTHS,
    band: (key === 'abbu' && BAND_ABBU[m.name]) || BAND[m.name] || undefined,
    meaning: MEANING[key][m.name] ?? MEANING.fallback,
  }));

export const dashboard = (key = 'ammi') => {
  const P = PARENTS[key];
  return {
    parent: {
      ...parentSummary(key),
      overallTitle: P.overallTitle,
      overallText: P.overallText,
      lastVisit: P.lastVisit,
      nextVisit: P.nextVisit,
      nextIn: P.nextIn,
      note: P.note,
      changes: P.changes,
      alerts: P.alerts.map((a, i) => ({ id: `${key}-a${i}`, ...a })),
    },
    nutritionist: HINA,
    checklist: P.items.map((i) => ({ code: i.id, kind: i.kind, title: i.title, simple: i.simple, dose: i.dose, time: i.time, done: i.done })),
    markers: markers(key),
  };
};

export const profile = (key = 'ammi') => {
  const pr = PROFILE[key];
  return {
    parent: {
      ...parentSummary(key),
      born: pr.born,
      languages: pr.langs,
      lives: pr.lives,
      conditions: pr.conditions,
      allergies: pr.allergies,
      medicines: pr.meds,
      diet: pr.diet,
      nextVisitLong: PARENTS[key].nextVisitLong,
    },
    contacts: CONTACTS,
    nutritionist: HINA,
  };
};

export const labs = (key = 'ammi') => ({ markers: markers(key), reports: REPORTS.map((r, i) => ({ id: `r${i}`, ...r })) });

export const nutrition = (key = 'ammi') => ({
  plan: {
    id: 'plan',
    weekOf: '5–11 October',
    createdLabel: 'Made by Hina on 28 Sep',
    days: WEEK[key].map((day) => day.map((code, j) => ({ code, slot: SLOTS[j], time: TIMES[j], name: DISHES[code].n, nut: DISHES[code].nut, why: DISHES[code].why, link: DISHES[code].link }))),
  },
  favor: FAVOR[key].favor,
  limit: FAVOR[key].limit,
  diet: PROFILE[key].diet,
  markers: PARENTS[key].markers.map(({ name, value, unit, status }) => ({ name, value, unit, status })),
});

export const supplements = (key = 'ammi') => ({
  supplements: PARENTS[key].items
    .filter((i) => i.kind === 'supp')
    .map((i) => ({ id: i.id, code: i.id, title: i.title, simple: i.simple, dose: i.dose, time: i.time, ...SUPPX[key][i.id], week: SUPPX[key][i.id].week.map((v, d) => (d === 4 ? (i.done ? 1 : null) : v)), reminderOn: true, doneToday: i.done })),
  interactions: INTERACT[key],
  markers: PARENTS[key].markers.map(({ name, value, unit, status }) => ({ name, value, unit, status })),
  todayIndex: 4,
});

const visitOf = (v) => ({ ...v, status: 'completed', meas: v.meas.map(([n, val, status]) => ({ n, v: val, status })) });
export const visits = (key = 'ammi') => ({
  next: { id: 'next', status: 'scheduled', date: VISITS[key].next.date, time: VISITS[key].next.time, plan: VISITS[key].next.plan },
  past: VISITS[key].past.map(visitOf),
  availability: { days: BOOK_DAYS, slots: BOOK_SLOTS.map((x) => ({ time: x.t, open: x.ok })) },
});

export const documents = (key = 'ammi') => DOCS[key].map((d, i) => ({ id: `d${i}`, name: d.n, type: d.t, file: d.f, by: d.by }));

export const messages = (key = 'ammi') =>
  MSGS[key].map((m, i) => {
    if (m.card) {
      const v = visitOf(VISITS[key].past.find((x) => x.id === m.card));
      return { id: `m${i}`, visit: { id: v.id, short: v.short, title: v.title, summary: v.summary, meas: v.meas.slice(0, 3) } };
    }
    const p = PEOPLE[m.from];
    return { id: `m${i}`, fromKey: m.from, fromName: m.from === 'sana' ? 'Sana Rahman' : m.from === 'bilal' ? 'Bilal Rahman' : p.name, fromRole: p.role, text: m.text, timeLabel: m.t, mine: m.from === 'sana' };
  });

export const threads = ['ammi', 'abbu'].map((key) => {
  const last = MSGS[key].filter((m) => !m.card).at(-1);
  return { parentId: key, key, name: `${PARENTS[key].short}'s care team`, last: last.text, time: last.t.split(' · ')[0] };
});

export const home = (key = 'ammi') => ({
  ...dashboard(key),
  children: [
    { id: 'sana', name: 'Sana', city: 'London', relation: 'Your daughter' },
    { id: 'bilal', name: 'Bilal', city: 'Dubai', relation: 'Your son' },
  ],
  nextVisit: { date: PARENTS[key].nextVisitLong, plan: VISITS[key].next.plan },
});

export const clients = CLIENTS.map((c, i) => ({ id: `c${i}`, ...c }));

export const library = {
  meals: Object.entries(DISHES).map(([code, d]) => ({ code, name: d.n, nut: d.nut, link: d.link })),
  supplements: LIB_SUPPS,
  markers: MARKER_NAMES,
};

export const nutritionistsForOnboarding = NUTS.map((n) => ({ id: n.id, name: n.name, credential: n.cred, languages: n.langs, areas: n.areas, next: n.next }));

export const adminOverview = {
  stats: [
    { label: 'Active families', value: '412', note: '18 joined this month' },
    { label: 'Visits this week', value: '166', note: 'of 204 booked' },
    { label: 'Open flags', value: '23', note: '2 need action today' },
    { label: 'Time to family update', value: '5.2 h', note: 'Average · target under 24 h' },
  ],
  queue: [
    { id: 'f1', status: 'attention', type: 'Critical result', title: 'Tariq Rahman: fasting sugar 142, rising for 4 months', meta: 'Hina Qureshi · flagged 2 days ago · family told', action: 'Review' },
    { id: 'f2', status: 'attention', type: 'Visit not logged', title: 'Mumtaz Hussain: 6 Oct visit has no notes', meta: 'Amna Sheikh · 3 days overdue', action: 'Contact' },
    { id: 'f3', status: 'watch', type: 'Licence', title: 'Usman Tariq: dietitian licence renews in 14 days', meta: 'Pakistan Nutrition & Dietetic Society', action: 'Send reminder' },
    { id: 'f4', status: 'watch', type: 'Lab upload', title: "4 reports couldn't be read automatically", meta: 'Blurry photos · oldest from yesterday', action: 'Open' },
    { id: 'f5', status: 'normal', type: 'Access request', title: "Imran Khan wants to add his sister to Zubaida Khan's care team", meta: 'Waiting for main contact to approve', action: 'View' },
  ],
  weekBars: [
    ['Mon', 38, 40],
    ['Tue', 32, 34],
    ['Wed', 36, 38],
    ['Thu', 41, 42],
    ['Today', 19, 34, true],
    ['Sat', 0, 16],
  ].map(([day, done, booked, isToday]) => ({ day, done, booked, isToday: !!isToday })),
  coverage: [
    ['Model Town', 64, 80],
    ['Gulberg', 71, 72],
    ['DHA', 58, 90],
    ['Johar Town', 49, 60],
    ['Cantt', 33, 40],
  ].map(([area, c, cap]) => {
    const pct = Math.round((c / cap) * 100);
    return { area, clients: c, capacity: cap, pct, status: pct > 95 ? 'attention' : pct > 80 ? 'watch' : 'normal' };
  }),
};

export const team = [
  ['Hina Qureshi', 'Model Town, Gulberg', 18, 14, '98%', 'normal', 'Active'],
  ['Amna Sheikh', 'DHA, Cantt', 22, 17, '91%', 'watch', '1 visit not logged'],
  ['Usman Tariq', 'Gulberg, Garden Town', 15, 12, '96%', 'watch', 'Licence due 23 Oct'],
  ['Sadia Malik', 'Johar Town', 20, 16, '94%', 'normal', 'Active'],
  ['Faraz Ahmed', 'Bahria Town', 9, 0, '—', 'normal', 'On leave until 19 Oct'],
].map(([name, area, clientsCount, week, onTime, status, label]) => ({ id: name, name, area, clients: clientsCount, week, onTime, status, label }));

export const families = [
  ['Rahman family', 'Sana Rahman · London', 'Ammi 72, Abbu 76', 'Hina Qureshi', 'attention', 'Today'],
  ['Khan family', 'Imran Khan · Toronto', 'Zubaida 81', 'Hina Qureshi', 'normal', 'Yesterday'],
  ['Hussain family', 'Ayesha Hussain · Riyadh', 'Mumtaz 69', 'Amna Sheikh', 'attention', '3 days ago'],
  ['Butt family', 'Saima Butt · Houston', 'Rehana 77, Aslam 80', 'Usman Tariq', 'watch', '2 days ago'],
  ['Ali family', 'Faisal Ali · Manchester', 'Nasir 74', 'Sadia Malik', 'normal', 'Today'],
].map(([family, contact, parentsLabel, nutritionist, status, last]) => ({ id: family, family, contact, parents: parentsLabel, nutritionist, status, last }));
