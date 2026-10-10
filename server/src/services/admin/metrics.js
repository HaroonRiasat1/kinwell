// Operational numbers, always worked out from records (visits, messages, parents).
import { Message, Parent, ServiceArea, Visit } from '../../models/index.js';
import { startOfWeek } from '../../utils/time.js';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
/** A booked visit counts as "not logged" once it is this far past its start time. */
export const NOT_LOGGED_AFTER_MS = 2 * HOUR;
/** Notes saved within this long after the visit count as "on time". */
export const ON_TIME_MS = 24 * HOUR;

export const weekRange = (now = new Date()) => {
  const from = startOfWeek(now);
  return { from, to: new Date(from.getTime() + 7 * DAY) };
};

export const isNotLogged = (v, now = Date.now()) =>
  ['scheduled', 'in_progress'].includes(v.status) && v.scheduledFor && v.scheduledFor.getTime() < now - NOT_LOGGED_AFTER_MS;

export function visitsThisWeek(filter = {}) {
  const { from, to } = weekRange();
  return Visit.find({ ...filter, scheduledFor: { $gte: from, $lt: to } }, 'status scheduledFor nutritionist parent loggedAt');
}

/** Booked visits whose time has passed without notes being saved. */
export function notLoggedVisits(filter = {}) {
  return Visit.find({
    ...filter,
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledFor: { $lt: new Date(Date.now() - NOT_LOGGED_AFTER_MS), $gte: new Date(Date.now() - 60 * DAY) },
  })
    .sort('scheduledFor')
    .populate('parent', 'fullName short family')
    .populate('nutritionist', 'name');
}

/** Share of the last 30 days' visits whose notes were saved within 24 hours (0–100, or null). */
export async function notesOnTime(filter = {}) {
  const visits = await Visit.find({ ...filter, status: 'completed', scheduledFor: { $gte: new Date(Date.now() - 30 * DAY) } }, 'scheduledFor loggedAt');
  const timed = visits.filter((v) => v.loggedAt);
  if (!timed.length) return null;
  return Math.round((timed.filter((v) => v.loggedAt - v.scheduledFor <= ON_TIME_MS).length / timed.length) * 100);
}

/**
 * Average hours from a home visit to the nutritionist's first message to that family
 * afterwards, over the last 30 days. Null when there's nothing to measure.
 */
export async function hoursToFamilyUpdate() {
  const since = new Date(Date.now() - 30 * DAY);
  const visits = await Visit.find({ status: 'completed', scheduledFor: { $gte: since } }, 'parent nutritionist scheduledFor');
  if (!visits.length) return null;
  const msgs = await Message.find({ parent: { $in: visits.map((v) => v.parent) }, createdAt: { $gte: since } }, 'parent from createdAt').sort('createdAt');
  const byParent = new Map();
  for (const m of msgs) {
    const k = String(m.parent);
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(m);
  }
  const gaps = visits
    .map((v) => {
      const first = (byParent.get(String(v.parent)) ?? []).find((m) => String(m.from) === String(v.nutritionist) && m.createdAt >= v.scheduledFor);
      return first ? (first.createdAt - v.scheduledFor) / HOUR : null;
    })
    .filter((h) => h !== null);
  return gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
}

const areaOf = (parentArea, areas) => areas.find((a) => (parentArea ?? '').toLowerCase().startsWith(a.name.toLowerCase()));

/** Each service area with how many current clients live there. */
export async function areaUsage() {
  const [areas, parents] = await Promise.all([ServiceArea.find().sort('name'), Parent.find({}, 'area')]);
  const counts = new Map(areas.map((a) => [a.id, 0]));
  for (const p of parents) {
    const a = areaOf(p.area, areas);
    if (a) counts.set(a.id, counts.get(a.id) + 1);
  }
  return areas.map((a) => {
    const clients = counts.get(a.id);
    const pct = a.capacity ? Math.round((clients / a.capacity) * 100) : 0;
    return { id: a.id, area: a.name, clients, capacity: a.capacity, pct, status: pct > 95 ? 'attention' : pct > 80 ? 'watch' : 'normal' };
  });
}
