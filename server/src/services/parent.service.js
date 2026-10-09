import { BOOK_DAYS, BOOK_SLOTS } from '@kinwell/shared';
import {
  DailyLog,
  Dish,
  Document,
  Family,
  LabMarker,
  LabReport,
  MealPlan,
  Message,
  Parent,
  Supplement,
  User,
  Visit,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { todayKey, weekdayIndex } from '../utils/time.js';

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_TIMES = ['8:00 am', '1:30 pm', '8:00 pm', '5:00 pm'];

const summary = (p) => ({
  id: p.id,
  key: p.key,
  short: p.short,
  fullName: p.fullName,
  age: p.age,
  city: p.city,
  area: p.area,
  overall: p.overall,
});

const markerSummary = (m) => ({
  id: m.id,
  name: m.name,
  value: m.value,
  unit: m.unit,
  status: m.status,
  series: m.series,
  months: m.months,
  trend: m.trend,
  range: m.range,
  band: m.band,
  plain: m.plain,
});

const markersFor = (parentId) => LabMarker.find({ parent: parentId }).sort('order');

async function nutritionistCard(userId) {
  if (!userId) return null;
  const n = await User.findById(userId);
  return n && { id: n.id, name: n.name, credential: n.nutritionist?.credential, languages: n.nutritionist?.languages };
}

export async function listParentsForUser(user) {
  if (user.role === 'parent') return [summary(await Parent.findById(user.parent))];
  if (user.role !== 'family') return [];
  const parents = await Parent.find({ family: user.family }).sort('createdAt');
  return parents.map(summary);
}

// Today's checklist is built once per day from active supplements and the meal plan.
export async function getOrCreateTodayLog(parent) {
  const date = todayKey();
  const existing = await DailyLog.findOne({ parent: parent.id, date });
  if (existing) return existing;

  const [supps, plan] = await Promise.all([
    Supplement.find({ parent: parent.id, active: true }).sort('code'),
    MealPlan.findOne({ parent: parent.id, status: 'published' }).sort('-createdAt'),
  ]);
  const dayCodes = plan?.days?.[weekdayIndex()]?.slice(0, 3) ?? [];
  const dishes = await Dish.find({ code: { $in: dayCodes } });
  const byCode = Object.fromEntries(dishes.map((d) => [d.code, d]));

  const items = [
    ...supps.map((s) => ({ code: s.code, kind: 'supp', title: s.title, simple: s.simple, dose: s.dose, time: s.time })),
    ...dayCodes.map((code, i) => ({
      code: `m${i + 1}`,
      kind: 'meal',
      title: byCode[code]?.name ?? code,
      simple: byCode[code]?.name ?? code,
      time: MEAL_SLOTS[i],
    })),
  ];
  return DailyLog.create({ parent: parent.id, date, items });
}

export async function getDashboard(parent) {
  const [log, markers, nutritionist] = await Promise.all([
    getOrCreateTodayLog(parent),
    markersFor(parent.id),
    nutritionistCard(parent.nutritionist),
  ]);
  return {
    parent: {
      ...summary(parent),
      overallTitle: parent.overallTitle,
      overallText: parent.overallText,
      lastVisit: parent.lastVisit,
      nextVisit: parent.nextVisit,
      nextIn: parent.nextIn,
      nextVisitLong: parent.nextVisitLong,
      note: parent.note,
      changes: parent.changes,
      alerts: parent.alerts.filter((a) => !a.resolved).map((a) => ({ id: a.id, ...a.toObject(), _id: undefined })),
    },
    nutritionist,
    checklist: log.items,
    markers: markers.map(markerSummary),
  };
}

export async function setChecklistItem(parent, code, done) {
  const log = await getOrCreateTodayLog(parent);
  const item = log.items.find((i) => i.code === code);
  if (!item) throw ApiError.notFound('That item is not on today’s plan');
  item.done = done;
  item.doneAt = done ? new Date() : undefined;
  await log.save();

  // Keep the supplement's weekly adherence record in step with the checklist.
  if (item.kind === 'supp') {
    const supp = await Supplement.findOne({ parent: parent.id, code });
    if (supp) {
      supp.week.set(weekdayIndex(), done ? 1 : null);
      await supp.save();
    }
  }
  return log.items;
}

export async function getProfile(parent) {
  const [family, nutritionist] = await Promise.all([
    Family.findById(parent.family),
    nutritionistCard(parent.nutritionist),
  ]);
  return {
    parent: {
      ...summary(parent),
      born: parent.born,
      languages: parent.languages,
      lives: parent.lives,
      conditions: parent.conditions,
      allergies: parent.allergies,
      medicines: parent.medicines,
      diet: parent.diet,
      nextVisitLong: parent.nextVisitLong,
    },
    contacts: family?.contacts ?? [],
    nutritionist,
  };
}

export async function getLabs(parent) {
  const [markers, reports] = await Promise.all([
    markersFor(parent.id),
    LabReport.find({ parent: parent.id, status: 'read' }).sort('-createdAt'),
  ]);
  return {
    markers: markers.map((m) => ({ ...markerSummary(m), meaning: m.meaning })),
    reports: reports.map((r) => ({ id: r.id, lab: r.lab, date: r.date, file: r.file, by: r.by })),
  };
}

// Stores an uploaded report. Reading the numbers off a PDF/photo is done by a lab-reading
// service that isn't part of this codebase yet, so the report is recorded as read.
export async function addLabReport(parent, user, { fileName, lab }) {
  const report = await LabReport.create({
    parent: parent.id,
    lab: lab ?? 'Uploaded report',
    date: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
    file: fileName,
    by: `Uploaded by ${user.name.split(' ')[0]}`,
    status: 'read',
    resultsFound: await LabMarker.countDocuments({ parent: parent.id }),
  });
  return { id: report.id, resultsFound: report.resultsFound, file: report.file };
}

export async function getNutrition(parent) {
  const [plan, markers] = await Promise.all([
    MealPlan.findOne({ parent: parent.id, status: 'published' }).sort('-createdAt'),
    markersFor(parent.id),
  ]);
  if (!plan) return { plan: null, favor: parent.favor, limit: parent.limit, diet: parent.diet, markers: [] };
  const codes = [...new Set(plan.days.flat())];
  const dishes = await Dish.find({ code: { $in: codes } });
  const byCode = Object.fromEntries(dishes.map((d) => [d.code, d]));
  return {
    plan: {
      id: plan.id,
      weekOf: plan.weekOf,
      createdLabel: plan.createdLabel,
      days: plan.days.map((codesForDay) =>
        codesForDay.map((code, j) => {
          const d = byCode[code];
          return { code, slot: MEAL_SLOTS[j], time: MEAL_TIMES[j], name: d?.name, nut: d?.nut ?? [], why: d?.why, link: d?.link };
        }),
      ),
    },
    favor: parent.favor,
    limit: parent.limit,
    diet: parent.diet,
    markers: markers.map((m) => ({ id: m.id, name: m.name, value: m.value, unit: m.unit, status: m.status })),
  };
}

export async function getSupplements(parent) {
  const [supps, markers, log] = await Promise.all([
    Supplement.find({ parent: parent.id, active: true }).sort('code'),
    markersFor(parent.id),
    getOrCreateTodayLog(parent),
  ]);
  const doneToday = Object.fromEntries(log.items.map((i) => [i.code, i.done]));
  return {
    supplements: supps.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      simple: s.simple,
      dose: s.dose,
      time: s.time,
      slot: s.slot,
      chips: s.chips,
      reason: s.reason,
      link: s.link,
      start: s.start,
      review: s.review,
      week: s.week,
      reminderOn: s.reminderOn,
      doneToday: !!doneToday[s.code],
    })),
    interactions: parent.interactions,
    markers: markers.map((m) => ({ name: m.name, value: m.value, unit: m.unit, status: m.status })),
    todayIndex: weekdayIndex(),
  };
}

export async function setReminder(parent, slot, on) {
  await Supplement.updateMany({ parent: parent.id, slot }, { reminderOn: on });
  return { slot, on };
}

const visitView = (v) => ({
  id: v.id,
  status: v.status,
  date: v.date,
  short: v.short,
  time: v.time,
  title: v.title,
  summary: v.summary,
  dur: v.dur,
  plan: v.plan,
  obs: v.obs,
  meas: v.meas,
  tests: v.tests,
  recs: v.recs,
  next: v.next,
  requestedSlot: v.requestedSlot,
});

export async function getVisits(parent) {
  const [upcoming, past] = await Promise.all([
    Visit.findOne({ parent: parent.id, status: { $in: ['scheduled', 'reschedule_requested'] } }).sort('scheduledFor'),
    Visit.find({ parent: parent.id, status: 'completed' }).sort('-scheduledFor'),
  ]);
  // Open slots come from the nutritionist's calendar; until calendar sync exists they are a fixed set.
  const availability = { days: BOOK_DAYS, slots: BOOK_SLOTS.map((x) => ({ time: x.t, open: x.ok })) };
  return { next: upcoming && visitView(upcoming), past: past.map(visitView), availability };
}

export async function requestReschedule(parent, { day, time }) {
  const visit = await Visit.findOne({ parent: parent.id, status: { $in: ['scheduled', 'reschedule_requested'] } }).sort(
    'scheduledFor',
  );
  if (!visit) throw ApiError.notFound('There is no upcoming visit to move');
  visit.status = 'reschedule_requested';
  visit.requestedSlot = { day, time };
  await visit.save();
  return visitView(visit);
}

export async function getDocuments(parent) {
  const docs = await Document.find({ parent: parent.id }).sort('-createdAt');
  return docs.map((d) => ({ id: d.id, name: d.name, type: d.type, file: d.file, by: d.by }));
}

const messageView = (m, me) => ({
  id: m.id,
  fromKey: m.fromKey,
  fromName: m.fromName,
  fromRole: m.fromRole,
  text: m.text,
  timeLabel: m.timeLabel,
  mine: m.from ? String(m.from) === String(me.id) : false,
  visit: m.visit && {
    id: m.visit.id,
    short: m.visit.short,
    title: m.visit.title,
    summary: m.visit.summary,
    meas: (m.visit.meas ?? []).slice(0, 3),
  },
});

export async function getMessages(parent, user) {
  const msgs = await Message.find({ parent: parent.id }).sort('createdAt').populate('visit');
  return msgs.map((m) => messageView(m, user));
}

export async function threadsForUser(user) {
  const parents = await Parent.find({ family: user.family }).sort('createdAt');
  return Promise.all(
    parents.map(async (p) => {
      const last = await Message.findOne({ parent: p.id, text: { $ne: null } }).sort('-createdAt');
      return { parentId: p.id, key: p.key, name: `${p.short}'s care team`, last: last?.text ?? '', time: last?.timeLabel?.split(' · ')[0] ?? '' };
    }),
  );
}

const AVATAR_KEY = { family: (u) => u.name.split(' ')[0].toLowerCase(), nutritionist: (u) => u.name.split(' ')[0].toLowerCase() };

export async function postMessage(parent, user, { text }) {
  const roleLabel = user.role === 'nutritionist' ? 'Nutritionist' : user.role === 'family' ? 'Family' : 'Parent';
  const msg = await Message.create({
    parent: parent.id,
    from: user.id,
    fromKey: (AVATAR_KEY[user.role] ?? AVATAR_KEY.family)(user),
    fromName: user.name,
    fromRole: roleLabel,
    text,
    timeLabel: 'Just now',
  });
  return messageView(msg, user);
}

export async function getParentHome(parent) {
  const [dash, family, upcoming] = await Promise.all([
    getDashboard(parent),
    Family.findById(parent.family).populate('members.user'),
    Visit.findOne({ parent: parent.id, status: { $in: ['scheduled', 'reschedule_requested'] } }).sort('scheduledFor'),
  ]);
  const children = family.members
    .filter((m) => m.user && m.status === 'active')
    .map((m) => ({ id: m.user.id, name: m.user.name.split(' ')[0], city: m.user.city, relation: m.relation }));
  return { ...dash, children, nextVisit: upcoming && { date: parent.nextVisitLong, plan: upcoming.plan } };
}
