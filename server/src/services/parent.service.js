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
import { env } from '../config/env.js';
import {
  calendarDaysUntil,
  dateKeyDaysAgo,
  longVisitLabel,
  relativeDays,
  shortDayLabel,
  shortVisitLabel,
  todayKey,
  weekDateKeys,
  weekdayIndex,
} from '../utils/time.js';
import { issueParentCode } from './auth.service.js';
import { dayLabel, label, localized, relativeDaysLabel, visitDateTime } from '../i18n/index.js';

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

const UPCOMING = { $in: ['scheduled', 'reschedule_requested'] };

/** Last/next visit labels worked out from real visit records (stored text is only a fallback). */
export async function visitSummary(parent) {
  const [last, next] = await Promise.all([
    Visit.findOne({ parent: parent.id, status: 'completed' }).sort('-scheduledFor'),
    Visit.findOne({ parent: parent.id, status: UPCOMING, scheduledFor: { $gte: new Date(Date.now() - 12 * 3600 * 1000) } }).sort('scheduledFor'),
  ]);
  return {
    lastVisit: last?.scheduledFor ? shortDayLabel(last.scheduledFor) : parent.lastVisit,
    nextVisit: next?.scheduledFor ? shortVisitLabel(next.scheduledFor) : next ? parent.nextVisit : null,
    nextIn: next?.scheduledFor ? relativeDays(calendarDaysUntil(next.scheduledFor)) : null,
    nextVisitLong: next?.scheduledFor ? longVisitLabel(next.scheduledFor) : next ? parent.nextVisitLong : null,
    upcoming: next,
    last,
  };
}

const startedOn = (supp) => {
  const t = Date.parse(supp.start ?? '');
  return Number.isNaN(t) ? null : todayKey(new Date(t));
};

/**
 * This week's record for each supplement, taken from the daily checklists:
 * 1 taken, 0 missed (a past day not ticked), null still to come or not started.
 */
async function weekAdherence(parent, supps) {
  const keys = weekDateKeys();
  const today = weekdayIndex();
  const logs = await DailyLog.find({ parent: parent.id, date: { $in: keys } });
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  return Object.fromEntries(
    supps.map((s) => {
      const start = startedOn(s);
      const week = keys.map((k, i) => {
        if (i > today || (start && k < start)) return null;
        const done = byDate[k]?.items.find((it) => it.code === s.code)?.done;
        if (i === today) return done ? 1 : null;
        return done ? 1 : 0;
      });
      return [s.code, week];
    }),
  );
}

/** Alerts for tablets that weren't ticked off on the last two days. */
async function missedDoseAlerts(parent) {
  const [supps, logs] = await Promise.all([
    Supplement.find({ parent: parent.id, active: true }).sort('code'),
    DailyLog.find({ parent: parent.id, date: { $in: [dateKeyDaysAgo(1), dateKeyDaysAgo(2)] } }),
  ]);
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  return supps.flatMap((s) => {
    const start = startedOn(s);
    const missed = [1, 2].filter((n) => {
      const key = dateKeyDaysAgo(n);
      if (start && key < start) return false;
      return !byDate[key]?.items.find((it) => it.code === s.code)?.done;
    });
    if (!missed.includes(1)) return [];
    const name = s.title.split(' · ')[0];
    const two = missed.length === 2;
    return [
      {
        id: `missed-${s.code}`,
        status: two ? 'attention' : 'watch',
        type: 'Missed',
        title: two ? `${name} missed 2 days` : `${name} missed yesterday`,
        text: `${parent.short} didn't tick off the ${s.slot.toLowerCase()} ${name} ${two ? 'yesterday or the day before' : 'yesterday'}.`,
        action: `Send ${parent.short} a reminder`,
      },
    ];
  });
}

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
      dish: code,
      kind: 'meal',
      title: byCode[code]?.name ?? code,
      simple: byCode[code]?.name ?? code,
      time: MEAL_SLOTS[i],
    })),
  ];
  return DailyLog.create({ parent: parent.id, date, items });
}

export async function getDashboard(parent) {
  const [log, markers, nutritionist, visits, missed] = await Promise.all([
    getOrCreateTodayLog(parent),
    markersFor(parent.id),
    nutritionistCard(parent.nutritionist),
    visitSummary(parent),
    missedDoseAlerts(parent),
  ]);
  const stored = parent.alerts.filter((a) => !a.resolved && a.type !== 'Missed').map((a) => ({ id: a.id, ...a.toObject(), _id: undefined }));
  const rank = { attention: 0, watch: 1, normal: 2 };
  return {
    parent: {
      ...summary(parent),
      overallTitle: parent.overallTitle,
      overallText: parent.overallText,
      lastVisit: visits.lastVisit,
      nextVisit: visits.nextVisit,
      nextIn: visits.nextIn,
      nextVisitLong: visits.nextVisitLong,
      note: parent.note,
      changes: parent.changes,
      alerts: [...stored, ...missed].sort((a, b) => rank[a.status] - rank[b.status]),
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
  return log.items;
}

export async function getProfile(parent) {
  const [family, nutritionist, visits] = await Promise.all([
    Family.findById(parent.family),
    nutritionistCard(parent.nutritionist),
    visitSummary(parent),
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
      nextVisitLong: visits.nextVisitLong,
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
  const weeks = await weekAdherence(parent, supps);
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
      week: weeks[s.code],
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

// Upcoming visits show date/time from the real appointment, in Lahore time.
const visitView = (v) => ({
  id: v.id,
  status: v.status,
  date: v.status !== 'completed' && v.scheduledFor ? longVisitLabel(v.scheduledFor).split(' at ')[0] : v.date,
  short: v.short,
  time: v.status !== 'completed' && v.scheduledFor ? longVisitLabel(v.scheduledFor).split(' at ')[1] : v.time,
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
    Visit.findOne({ parent: parent.id, status: UPCOMING, scheduledFor: { $gte: new Date(Date.now() - 12 * 3600 * 1000) } }).sort('scheduledFor'),
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

/**
 * The parent's own screen, in their language: checklist wording, meal names,
 * the nutritionist's note, visit date and city names are all localised.
 */
export async function getParentHome(parent, lang = 'en') {
  const [dash, family, visits, nutritionist, supps] = await Promise.all([
    getDashboard(parent),
    Family.findById(parent.family).populate('members.user'),
    visitSummary(parent),
    User.findById(parent.nutritionist),
    Supplement.find({ parent: parent.id }),
  ]);
  const dishes = await Dish.find({ code: { $in: dash.checklist.map((i) => i.dish).filter(Boolean) } });
  const suppBy = Object.fromEntries(supps.map((s) => [s.code, s]));
  const dishBy = Object.fromEntries(dishes.map((d) => [d.code, d]));

  const checklist = dash.checklist.map((item) => {
    const it = item.toObject ? item.toObject() : { ...item };
    if (it.kind === 'supp' && suppBy[it.code]) {
      const s = suppBy[it.code];
      return { ...it, simple: localized(s, 'simple', lang) ?? it.simple, dose: localized(s, 'dose', lang) ?? it.dose, time: localized(s, 'time', lang) ?? it.time };
    }
    const d = dishBy[it.dish];
    return { ...it, simple: d ? localized(d, 'name', lang) : it.simple, time: label(it.time, lang) };
  });

  const children = family.members
    .filter((m) => m.user && m.status === 'active')
    .map((m) => ({ id: m.user.id, name: m.user.name.split(' ')[0], city: label(m.user.city, lang), relation: m.relation, phone: m.user.phone ?? null }));

  const next = visits.upcoming?.scheduledFor;
  const note = localized(parent, 'note', lang);
  return {
    ...dash,
    parent: { ...dash.parent, short: localized(parent, 'short', lang) },
    checklist,
    children,
    language: lang,
    nextVisit: visits.upcoming && {
      date: next ? visitDateTime(next, lang).full : visits.nextVisitLong,
      nextIn: next ? relativeDaysLabel(calendarDaysUntil(next), lang) : visits.nextIn,
      plan: visits.upcoming.plan,
    },
    // The latest plain-language note from the nutritionist, so the parent can read it too.
    latestNote: note && {
      text: note,
      from: nutritionist?.name ?? 'Your nutritionist',
      after: visits.last?.scheduledFor ? dayLabel(visits.last.scheduledFor, lang) : visits.lastVisit,
    },
  };
}

/**
 * A family member creates a sign-in code for their parent and passes it on
 * (phone call, WhatsApp). This is how parents sign in until SMS is connected.
 */
export async function createParentSignInCode(parent) {
  const parentUser = await User.findOne({ role: 'parent', parent: parent.id });
  if (!parentUser?.phone) throw ApiError.badRequest(`${parent.short} doesn't have a phone number on Kinwell yet.`);
  const { code, expiresAt } = await issueParentCode(parentUser);
  const link = `${env.publicUrl}/login?as=parent&phone=${encodeURIComponent(parentUser.phone)}`;
  return {
    code,
    expiresAt,
    phone: parentUser.phone,
    link,
    shareText: `Assalam-o-Alaikum ${parent.short}! Your Kinwell code is ${code}. Open ${link} and type the code. It works for 30 minutes.`,
  };
}
