import { Flag, Notification } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { record } from './audit.js';

/** Most urgent first, then newest. */
const RANK = { attention: 0, watch: 1, normal: 2 };
export const byUrgency = (a, b) => RANK[a.status] - RANK[b.status] || b.createdAt - a.createdAt;

/** Shape sent to the admin UI. `contact` is filled for flags about a staff member. */
export function flagView(f) {
  const u = f.link?.user;
  const populated = u && typeof u === 'object' && u.name;
  return {
    id: f.id,
    status: f.status,
    type: f.type,
    title: f.title,
    meta: f.meta,
    action: f.action,
    link: {
      kind: f.link?.kind ?? null,
      parent: f.link?.parent ? String(f.link.parent) : null,
      family: f.link?.family ? String(f.link.family) : null,
      user: u ? String(populated ? u._id : u) : null,
      visit: f.link?.visit ? String(f.link.visit) : null,
      accessRequest: f.link?.accessRequest ? String(f.link.accessRequest) : null,
    },
    contact: populated ? { name: u.name, email: u.email, phone: u.phone } : null,
    notes: (f.notes ?? []).map((n) => ({ text: n.text, by: n.byName, at: n.at })),
    createdAt: f.createdAt,
    resolved: f.resolved,
    resolvedAt: f.resolvedAt,
    resolvedBy: f.resolvedBy?.name ?? null,
    resolutionNote: f.resolutionNote ?? null,
  };
}

const load = async (id) => {
  const f = await Flag.findById(id).populate('link.user', 'name email phone').populate('resolvedBy', 'name');
  if (!f) throw ApiError.notFound('Flag not found');
  return f;
};

export async function list({ state = 'open' } = {}) {
  const flags = await Flag.find({ resolved: state === 'resolved' })
    .sort(state === 'resolved' ? '-resolvedAt' : '-createdAt')
    .limit(100)
    .populate('link.user', 'name email phone')
    .populate('resolvedBy', 'name');
  return (state === 'resolved' ? flags : flags.sort(byUrgency)).map(flagView);
}

export async function resolve(admin, id, { note } = {}) {
  const f = await load(id);
  Object.assign(f, { resolved: true, resolvedBy: admin.id, resolvedAt: new Date(), resolutionNote: note || undefined });
  await f.save();
  await record(admin, 'flag.resolve', `Resolved “${f.title}”${note ? `: ${note}` : ''}`, { kind: 'flag', id: f._id, label: f.title });
  return flagView(await load(id));
}

export async function reopen(admin, id) {
  const f = await load(id);
  Object.assign(f, { resolved: false, resolvedBy: undefined, resolvedAt: undefined, resolutionNote: undefined });
  await f.save();
  await record(admin, 'flag.reopen', `Reopened “${f.title}”`, { kind: 'flag', id: f._id, label: f.title });
  return flagView(await load(id));
}

export async function addNote(admin, id, { text }) {
  const f = await load(id);
  f.notes.push({ text, by: admin.id, byName: admin.name, at: new Date() });
  await f.save();
  await record(admin, 'flag.note', `Noted on “${f.title}”: ${text}`, { kind: 'flag', id: f._id, label: f.title });
  return flagView(await load(id));
}

/** Sends the staff member the flag is about an in-app reminder, and notes it on the flag. */
export async function remind(admin, id, { message }) {
  const f = await load(id);
  const user = f.link?.user;
  if (!user?._id) throw ApiError.badRequest('This flag is not about a staff member.');
  await Notification.create({ user: user._id, title: f.title, body: message, from: admin.name });
  f.notes.push({ text: `Reminder sent to ${user.name}: ${message}`, by: admin.id, byName: admin.name, at: new Date() });
  await f.save();
  await record(admin, 'flag.remind', `Sent ${user.name} a reminder about “${f.title}”`, { kind: 'user', id: user._id, label: user.name });
  return flagView(await load(id));
}

/** Closes open flags of a kind (e.g. when the lab-upload queue is emptied). */
export async function resolveByKind(admin, kind, note) {
  const open = await Flag.find({ resolved: false, 'link.kind': kind });
  for (const f of open) {
    Object.assign(f, { resolved: true, resolvedBy: admin.id, resolvedAt: new Date(), resolutionNote: note });
    await f.save();
  }
}
