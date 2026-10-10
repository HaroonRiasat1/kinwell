// Home visits from the nutritionist's side: logging a visit (with safety checks),
// today's schedule, clashes, and families' requests to move a visit.
import { Flag, LabMarker, Message, Visit } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { dateKeyFromLabel, lahoreDateTime, todayKey } from '../../utils/time.js';
import { MARKER_FOR, assessVitals } from '../vitals.js';
import { recordResult } from '../labs/markers.js';
import { ownClient } from './clients.js';

const HOUR = 3600 * 1000;
const fmt = (d, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', ...opts }).format(d).replace('Sept', 'Sep');
const shortDay = (d) => fmt(d, { day: 'numeric', month: 'short' });
const clock = (d) => fmt(d, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').replace(/\s?(am|pm)/i, (x) => ` ${x.trim().toLowerCase()}`);
const fromNut = (nut) => ({ from: nut.id, fromKey: nut.name.split(' ')[0].toLowerCase(), fromName: nut.name, fromRole: 'Nutritionist' });

/** Writes a home reading into the client's matching lab marker (if they have one). */
async function updateMarker(parentId, reading) {
  const name = MARKER_FOR[reading.label];
  if (!name || !(await LabMarker.exists({ parent: parentId, name }))) return;
  await recordResult(parentId, { name, value: reading.value, number: reading.number, status: reading.status });
}

/**
 * Saves a completed home visit. Readings are validated and graded; anything that needs
 * attention updates the client's status, adds an alert for the family and a flag for admins.
 * The family gets the visit summary in their messages.
 */
export async function logVisit(nutritionist, parentId, input) {
  const parent = await ownClient(nutritionist, parentId);
  const { readings, errors } = assessVitals(input.vitals);
  if (Object.keys(errors).length) throw ApiError.badRequest('Please check the readings marked below.', errors);
  const notes = input.notes?.trim() ?? '';
  if (!readings.length && !input.observations?.length && !notes && !input.tests?.length) {
    throw ApiError.badRequest('Add at least one reading, observation or note before saving the visit.');
  }

  const now = new Date();
  // Complete the booked visit this is for (the most recent one that's due), or record a new one.
  const booked = await Visit.findOne({
    parent: parent.id,
    status: { $in: ['scheduled', 'in_progress', 'reschedule_requested'] },
    scheduledFor: { $lte: new Date(now.getTime() + 12 * HOUR) },
  }).sort('-scheduledFor');
  const visit = booked ?? new Visit({ parent: parent.id, scheduledFor: now });
  const when = visit.scheduledFor ?? now;
  const urgent = readings.filter((r) => r.status === 'attention');
  const describe = (r) => `${MARKER_FOR[r.label] ?? r.label} ${r.value} ${r.unit}`;

  visit.set({
    nutritionist: nutritionist.id,
    status: 'completed',
    loggedAt: now,
    date: fmt(when, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    short: shortDay(when),
    title: urgent.length ? 'Visit · readings need attention' : 'Home visit',
    summary: notes ? notes.slice(0, 160) : readings.length ? readings.map((r) => `${r.label} ${r.value}`).join(' · ') : (input.observations ?? []).join(', '),
    obs: input.observations,
    meas: readings.map((r) => ({ n: r.label, v: `${r.value} ${r.unit}`, status: r.status })),
    tests: input.tests,
    mood: input.mood,
    requestedSlot: undefined,
  });
  await visit.save();

  for (const r of readings) await updateMarker(parent.id, r);

  if (notes) {
    parent.note = notes;
    // An old translation of the previous note would now be wrong, so drop it.
    const ur = parent.i18n?.get('ur');
    if (ur?.note) parent.i18n.set('ur', { ...ur, note: undefined });
  }
  if (urgent.length) {
    for (const r of urgent) {
      parent.alerts.unshift({
        status: 'attention',
        type: 'Visit reading',
        title: `${MARKER_FOR[r.label] ?? r.label} ${r.word ?? 'out of range'} at visit (${r.value} ${r.unit})`,
        text: `Recorded by ${nutritionist.name} on ${shortDay(when)}. ${nutritionist.name.split(' ')[0]} will follow up and may suggest seeing a doctor.`,
        action: 'See result',
      });
    }
    if (parent.overall !== 'attention') {
      parent.overall = 'attention';
      parent.overallTitle = 'Needs attention after the latest visit';
    }
    await Flag.create({
      status: 'attention',
      type: 'Critical result',
      title: `${parent.fullName}: ${urgent.map(describe).join(', ')} at home visit`,
      meta: `${nutritionist.name} · recorded ${shortDay(when)} · family told`,
      action: 'Review',
      link: { kind: 'parent', parent: parent.id, family: parent.family, user: nutritionist.id },
    });
  }
  await parent.save();

  // The family sees the visit as a summary card, plus the note in plain words.
  await Message.create({ parent: parent.id, ...fromNut(nutritionist), visit: visit.id, timeLabel: 'Just now' });
  if (notes) await Message.create({ parent: parent.id, ...fromNut(nutritionist), text: notes, timeLabel: 'Just now' });

  return {
    id: visit.id,
    readings: readings.map(({ label, value, unit, status }) => ({ label, value, unit, status })),
    attention: urgent.length,
  };
}

/** Booked visits within an hour of each other for the same nutritionist. */
function markClashes(visits) {
  const sorted = [...visits].sort((a, b) => a.scheduledFor - b.scheduledFor);
  const clashes = new Set();
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].scheduledFor - sorted[i - 1].scheduledFor < HOUR) {
      clashes.add(String(sorted[i]._id));
      clashes.add(String(sorted[i - 1]._id));
    }
  }
  return clashes;
}

const visitRow = (v, clashes, now = Date.now()) => ({
  id: v.id,
  at: v.scheduledFor,
  day: fmt(v.scheduledFor, { weekday: 'short', day: 'numeric', month: 'short' }),
  time: clock(v.scheduledFor),
  parent: v.parent && { id: v.parent.id, name: v.parent.fullName, area: v.parent.area, status: v.parent.overall },
  state:
    v.status === 'completed'
      ? 'done'
      : v.status === 'reschedule_requested'
        ? 'requested'
        : v.scheduledFor.getTime() < now - 2 * HOUR
          ? 'not_logged'
          : v.scheduledFor.getTime() < now + HOUR
            ? 'now'
            : 'upcoming',
  clash: clashes.has(String(v._id)),
});

/** Hina's day: today's visits, anything not logged, requests to move visits, and the next 7 days. */
export async function today(nutritionist) {
  const now = new Date();
  const key = todayKey(now);
  const start = lahoreDateTime(key, '12:00 am');
  const weekEnd = new Date(start.getTime() + 8 * 24 * HOUR);
  const [upcoming, notLogged, requests] = await Promise.all([
    Visit.find({ nutritionist: nutritionist.id, scheduledFor: { $gte: start, $lt: weekEnd } }).populate('parent', 'fullName area overall'),
    Visit.find({ nutritionist: nutritionist.id, status: { $in: ['scheduled', 'in_progress'] }, scheduledFor: { $lt: new Date(Math.min(start.getTime(), now.getTime() - 2 * HOUR)), $gte: new Date(now.getTime() - 60 * 24 * HOUR) } })
      .sort('scheduledFor')
      .populate('parent', 'fullName area overall'),
    Visit.find({ nutritionist: nutritionist.id, status: 'reschedule_requested' }).sort('scheduledFor').populate('parent', 'fullName area overall family'),
  ]);
  const clashes = markClashes(upcoming.filter((v) => v.status !== 'completed'));
  const rows = upcoming.sort((a, b) => a.scheduledFor - b.scheduledFor).map((v) => visitRow(v, clashes, now.getTime()));
  return {
    date: fmt(now, { weekday: 'long', day: 'numeric', month: 'long' }),
    today: rows.filter((r) => todayKey(new Date(r.at)) === key),
    week: rows.filter((r) => todayKey(new Date(r.at)) !== key),
    notLogged: notLogged.map((v) => visitRow(v, new Set(), now.getTime())),
    clashes: rows.filter((r) => r.clash && r.state !== 'done').length,
    requests: requests.map((v) => ({
      visitId: v.id,
      parent: { id: v.parent.id, name: v.parent.fullName },
      from: `${fmt(v.scheduledFor, { weekday: 'short', day: 'numeric', month: 'short' })}, ${clock(v.scheduledFor)}`,
      to: `${v.requestedSlot?.day}, ${v.requestedSlot?.time}`,
    })),
  };
}

/** Accept moves the visit to the requested time (if it doesn't clash); decline keeps it. The family is told. */
export async function decideReschedule(nutritionist, visitId, { decision }) {
  const visit = await Visit.findOne({ _id: visitId, nutritionist: nutritionist.id, status: 'reschedule_requested' }).populate('parent', 'fullName short');
  if (!visit) throw ApiError.notFound('That request was already handled.');
  const { day, time } = visit.requestedSlot ?? {};
  let text;
  if (decision === 'accept') {
    const key = dateKeyFromLabel(day);
    if (!key) throw ApiError.badRequest("The requested date couldn't be read.");
    const at = lahoreDateTime(key, time);
    const clash = await Visit.findOne({
      _id: { $ne: visit.id },
      nutritionist: nutritionist.id,
      status: { $in: ['scheduled', 'reschedule_requested', 'in_progress'] },
      scheduledFor: { $gt: new Date(at.getTime() - HOUR), $lt: new Date(at.getTime() + HOUR) },
    }).populate('parent', 'fullName');
    if (clash) throw ApiError.badRequest(`You already have ${clash.parent.fullName} at ${clock(clash.scheduledFor)} that day. Suggest another time instead.`);
    visit.scheduledFor = at;
    text = `I've moved ${visit.parent.short}'s visit to ${day} at ${time}. See you then.`;
  } else {
    text = `Sorry, I can't make ${day} at ${time}. ${visit.parent.short}'s visit stays on ${fmt(visit.scheduledFor, { weekday: 'long', day: 'numeric', month: 'long' })} at ${clock(visit.scheduledFor)}. Message me if you'd like another time.`;
  }
  visit.status = 'scheduled';
  visit.requestedSlot = undefined;
  await visit.save();
  await Message.create({ parent: visit.parent.id, ...fromNut(nutritionist), text, timeLabel: 'Just now' });
  return today(nutritionist);
}
