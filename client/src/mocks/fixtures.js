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
import urContent from '@kinwell/shared/i18n/ur.js';

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

// Parent-facing content in Urdu, mirroring what the API returns with X-Language: ur.
const URDU_LABELS = { Breakfast: 'ناشتہ', Lunch: 'دوپہر کا کھانا', Dinner: 'رات کا کھانا', London: 'لندن', Dubai: 'دبئی' };
const urduHome = (key, h) => ({
  ...h,
  parent: { ...h.parent, short: urContent.names[key] },
  checklist: h.checklist.map((i) => {
    if (i.kind === 'supp') return { ...i, ...urContent.supplements[key][i.code] };
    const dish = Object.entries(DISHES).find(([, d]) => d.n === i.title)?.[0];
    return { ...i, simple: urContent.dishes[dish]?.name ?? i.simple, time: URDU_LABELS[i.time] ?? i.time };
  }),
  children: h.children.map((c) => ({ ...c, city: URDU_LABELS[c.city] ?? c.city })),
  nextVisit: { ...h.nextVisit, date: 'پیر، 12 اکتوبر، صبح 11 بجے', nextIn: '2 دن میں' },
  latestNote: { ...h.latestNote, text: urContent.notes[key], after: '28 ستمبر' },
});

export const home = (key = 'ammi', lang = 'en') => (lang === 'ur' ? urduHome(key, homeEn(key)) : homeEn(key));

const homeEn = (key = 'ammi') => ({
  ...dashboard(key),
  children: [
    { id: 'sana', name: 'Sana', city: 'London', relation: 'Your daughter', phone: '+447700900412' },
    { id: 'bilal', name: 'Bilal', city: 'Dubai', relation: 'Your son', phone: '+971501234567' },
  ],
  nextVisit: { date: PARENTS[key].nextVisitLong, nextIn: PARENTS[key].nextIn, plan: VISITS[key].next.plan },
  latestNote: { text: PARENTS[key].note, from: 'Hina Qureshi', after: PARENTS[key].lastVisit },
});

export const clients = CLIENTS.map((c, i) => ({ id: `c${i}`, ...c }));

export const library = {
  meals: Object.entries(DISHES).map(([code, d]) => ({ code, name: d.n, nut: d.nut, link: d.link })),
  supplements: LIB_SUPPS,
  markers: MARKER_NAMES,
};

export const nutritionistsForOnboarding = NUTS.map((n) => ({ id: n.id, name: n.name, credential: n.cred, languages: n.langs, areas: n.areas, next: n.next }));

const flag = (id, status, type, title, meta, action, link, contact = null) => ({ id, status, type, title, meta, action, link: { kind: null, parent: null, family: null, user: null, visit: null, accessRequest: null, ...link }, contact, notes: [], resolved: false });

export const adminOverview = {
  stats: [
    { key: 'families', label: 'Active families', value: '70', note: '8 joined this month', to: '/admin/families' },
    { key: 'visits', label: 'Visits this week', value: '29', note: 'of 37 booked', to: '/admin/nutritionists' },
    { key: 'notLogged', label: 'Visits not logged', value: '2', note: 'Past their time, no notes yet', status: 'watch', to: '/admin/nutritionists' },
    { key: 'flags', label: 'Open flags', value: '5', note: '2 need action today', status: 'attention' },
    { key: 'update', label: 'Time to family update', value: '12.4 h', note: 'Average, last 30 days · target under 24 h', status: 'normal' },
  ],
  queue: [
    flag('f1', 'attention', 'Critical result', 'Tariq Rahman: fasting sugar 142, rising for 4 months', 'Hina Qureshi · flagged 2 days ago · family told', 'Review', { kind: 'parent', parent: 'abbu', family: 'rahman' }, { name: 'Hina Qureshi', email: 'hina.qureshi@kinwell.pk' }),
    flag('f2', 'attention', 'Visit not logged', 'Mumtaz Hussain: 6 Oct visit has no notes', 'Amna Sheikh · 4 days overdue', 'Contact', { kind: 'visit', family: 'hussain' }, { name: 'Amna Sheikh', email: 'amna.sheikh@kinwell.pk', phone: '+923001234567' }),
    flag('f3', 'watch', 'Licence', 'Usman Tariq: dietitian licence renews in 14 days', 'Pakistan Nutrition & Dietetic Society', 'Send reminder', { kind: 'nutritionist' }, { name: 'Usman Tariq', email: 'usman.tariq@kinwell.pk' }),
    flag('f4', 'watch', 'Lab upload', "4 reports couldn't be read automatically", 'Blurry or cut-off photos · newest 3 hours ago', 'See reports', { kind: 'labUploads' }),
    flag('f5', 'normal', 'Access request', "Imran Khan wants to add his sister Nadia to Zubaida Khan's care team", 'Waiting for a decision', 'View', { kind: 'accessRequest' }),
  ],
  queues: { labUploads: 4, accessRequests: 1 },
  weekBars: [
    ['Mon', 3, 0, 3],
    ['Tue', 5, 1, 6],
    ['Wed', 10, 0, 10],
    ['Thu', 0, 1, 1],
    ['Fri', 5, 0, 5],
    ['Today', 6, 0, 6, true],
    ['Sun', 0, 0, 6],
  ].map(([day, done, overdue, booked, isToday]) => ({ day, done, overdue, booked, upcoming: booked - done - overdue, isToday: !!isToday })),
  coverage: [
    ['Bahria Town', 9, 12],
    ['Cantt', 8, 12],
    ['DHA', 16, 20],
    ['Gulberg', 15, 14],
    ['Johar Town', 23, 26],
    ['Model Town', 8, 15],
  ].map(([area, c, cap]) => {
    const pct = Math.round((c / cap) * 100);
    return { id: area, area, clients: c, capacity: cap, pct, status: pct > 95 ? 'attention' : pct > 80 ? 'watch' : 'normal' };
  }),
};

export const team = [
  ['Amna Sheikh', 'DHA Phase 5, DHA Phase 6, Cantt', 22, 6, 11, 2, 95, 'attention', '2 visits not logged'],
  ['Faraz Ahmed', 'Bahria Town', 9, 0, 0, 0, 89, 'watch', 'On leave until 19 Oct'],
  ['Hina Qureshi', 'Model Town, Gulberg, Johar Town', 18, 6, 6, 0, 85, 'normal', 'Active'],
  ['Sadia Malik', 'Johar Town', 20, 9, 10, 0, 90, 'normal', 'Active'],
  ['Usman Tariq', 'Gulberg, Garden Town', 15, 4, 6, 0, 90, 'watch', 'Licence due 24 Oct'],
].map(([name, area, clientsCount, weekDone, week, notLogged, onTime, status, label]) => ({ id: name, name, area, clients: clientsCount, weekDone, week, notLogged, onTime, status, label, active: true }));

export const families = {
  items: [
    ['Rahman family', 'Sana Rahman · London', 'Ammi 72, Abbu 76', 'Hina Qureshi', 'attention', 'Today'],
    ['Hussain family', 'Ayesha Hussain · Riyadh', 'Mumtaz 69', 'Amna Sheikh', 'attention', '3 days ago'],
    ['Butt family', 'Saima Butt · Houston', 'Rehana 77, Aslam 80', 'Usman Tariq', 'watch', '2 days ago'],
    ['Khan family', 'Imran Khan · Toronto', 'Zubaida 81', 'Hina Qureshi', 'normal', 'Yesterday'],
    ['Ali family', 'Faisal Ali · Manchester', 'Nasir 74', 'Sadia Malik', 'normal', 'Today'],
  ].map(([family, contact, parentsLabel, nutritionist, status, last]) => ({ id: family, family, contact, parents: parentsLabel, nutritionist, status, last })),
  page: 1,
  pages: 4,
  total: 70,
};

export const activity = {
  items: [
    ['Zara Ahmed', 'Assigned Zubaida Khan (Khan family) to Sadia Malik'],
    ['Zara Ahmed', 'Sent Amna Sheikh a reminder about “Mumtaz Hussain: 6 Oct visit has no notes”'],
    ['Zara Ahmed', 'Approved Nadia Khan (nadia.khan@example.com) joining the Khan family'],
  ].map(([actor, summary], i) => ({ id: `a${i}`, at: new Date(Date.now() - i * 3600e3).toISOString(), actor, summary })),
  page: 1,
  pages: 1,
  total: 3,
};

// ---------- Nutritionist workspace ----------
const at = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const row = (id, name, area, status, time, day, state, clash = false) => ({ id, at: at(0), day, time, parent: { id: `p-${id}`, name, area, status }, state, clash });
export const workspaceToday = {
  date: 'Saturday, 10 October',
  today: [
    row('v1', 'Shahid Rana', 'Gulberg', 'normal', '12 pm', 'Sat 10 Oct', 'done'),
    row('v2', 'Nasreen Chaudhry', 'Johar Town', 'watch', '3:30 pm', 'Sat 10 Oct', 'upcoming'),
    row('v3', 'Parveen Sheikh', 'Model Town', 'watch', '5 pm', 'Sat 10 Oct', 'upcoming'),
  ],
  week: [
    row('v4', 'Fatima Rahman', 'Model Town', 'watch', '11 am', 'Mon 12 Oct', 'upcoming'),
    row('v5', 'Tariq Rahman', 'Model Town', 'attention', '12 pm', 'Mon 12 Oct', 'upcoming'),
    row('v6', 'Kausar Raza', 'Model Town', 'normal', '3 pm', 'Thu 15 Oct', 'upcoming'),
  ],
  notLogged: [],
  clashes: 0,
  requests: [{ visitId: 'r1', parent: { id: 'p-z', name: 'Zubaida Khan' }, from: 'Fri 16 Oct, 3 pm', to: 'Saturday 17 October, 11:00 am' }],
};
export const workspaceInbox = {
  needsReply: 2,
  threads: [
    { parentId: 'ammi', name: 'Fatima Rahman', family: 'Rahman family', from: 'Sana Rahman', last: 'Hina, Ammi says her ankles are swelling in the evenings again. Should we be worried?', time: 'Today', needsReply: true },
    { parentId: 'abbu', name: 'Tariq Rahman', family: 'Rahman family', from: 'Sana Rahman', last: "He missed his B12 on Tuesday and today. I'll call him tonight.", time: 'Wed 7 Oct', needsReply: true },
  ],
};
export const workspaceClient = (key = 'ammi') => ({
  parent: { id: key, fullName: PROFILE[key].full, short: PARENTS[key].short, age: PARENTS[key].age, area: 'Model Town', overall: PARENTS[key].overall, overallTitle: PARENTS[key].overallTitle },
  family: { id: 'rahman', name: 'Rahman family', contact: { name: 'Sana Rahman', email: 'sana.rahman@gmail.com', phone: '+447700900412', city: 'London' } },
  lastVisit: 'Mon 28 Sep',
  nextVisit: 'Mon 12 Oct, 11 am',
  nextIn: 'In 2 days',
  plan: { published: { weekOf: '5–11 October', createdLabel: 'Made by Hina on 28 Sep' }, hasDraft: false },
});
export const weekPlan = (key = 'ammi') => ({
  weekOf: '12–18 October',
  isDraft: false,
  published: { weekOf: '5–11 October', createdLabel: 'Made by Hina on 28 Sep' },
  days: WEEK[key].map((d) => [...d]),
  links: {},
  supplements: ['vitd', 'cal'],
});

// ---------- Lab report upload ----------
export const labTests = ['HbA1c', 'Fasting blood sugar', 'Vitamin D', 'Vitamin B12', 'Hemoglobin', 'LDL cholesterol', 'HDL cholesterol', 'Total cholesterol', 'Triglycerides', 'Creatinine', 'TSH', 'Ferritin'].map((name) => ({
  name,
  unit: { HbA1c: '%', Hemoglobin: 'g/dL', 'Vitamin D': 'ng/mL', 'Vitamin B12': 'pg/mL', TSH: 'mIU/L', Ferritin: 'ng/mL' }[name] ?? 'mg/dL',
}));
export const reportReview = {
  lab: 'Chughtai Lab',
  date: '26 Sep 2026',
  rows: [
    { name: 'Fasting blood sugar', value: '118', include: true, confidence: 'high', line: 'Glucose Fasting 118 mg/dL 70 - 99' },
    { name: 'HbA1c', value: '6.4', include: true, confidence: 'decimal', raw: '64 %', line: 'HbA1c 64 % 40-56' },
    { name: 'Vitamin D', value: '18', include: true, confidence: 'high', from: 'nmol/L', raw: '45 nmol/L', line: '25-OH Vitamin D 45 nmol/L' },
    { name: 'Vitamin B12', value: '410', include: true, confidence: 'check', line: 'Vitamin B12 410' },
    { name: 'Hemoglobin', value: '', include: true, confidence: 'unclear', raw: '1.6 g/dL', line: 'Hemoglobin (Hb) 1.6 g/dL 12.0-15.5' },
  ],
};
