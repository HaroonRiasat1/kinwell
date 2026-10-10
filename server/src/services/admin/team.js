import crypto from 'node:crypto';
import { Family, Notification, Parent, User, Visit } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { visitSummary } from '../parent.service.js';
import { record } from './audit.js';
import { isNotLogged, notesOnTime, notLoggedVisits, visitsThisWeek } from './metrics.js';

const DAY = 24 * 3600 * 1000;
const shortDate = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(d);

/** Readable one-time password: no 0/O/1/l confusion. */
export const tempPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(12), (b) => chars[b % chars.length]).join('').replace(/(.{4})(?!$)/g, '$1-');
};

/** The single most important thing about a nutritionist right now. */
function statusFor(u, notLogged) {
  const n = u.nutritionist ?? {};
  if (u.active === false) return { status: 'normal', label: 'Account turned off' };
  if (n.availability === 'on_leave') return { status: 'watch', label: `On leave${n.leaveUntil ? ` until ${shortDate(n.leaveUntil)}` : ''}` };
  if (notLogged) return { status: 'attention', label: `${notLogged} visit${notLogged > 1 ? 's' : ''} not logged` };
  if (n.licenceRenewsOn && n.licenceRenewsOn - Date.now() < 30 * DAY) return { status: 'watch', label: `Licence due ${shortDate(n.licenceRenewsOn)}` };
  return { status: 'normal', label: 'Active' };
}

export async function list({ q = '' } = {}) {
  const filter = { role: 'nutritionist' };
  if (q.trim()) filter.name = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [people, week, notLogged] = await Promise.all([User.find(filter).sort('name'), visitsThisWeek(), notLoggedVisits()]);
  return Promise.all(
    people.map(async (u) => {
      const mine = (v) => String(v.nutritionist?._id ?? v.nutritionist) === u.id;
      const myWeek = week.filter(mine);
      const late = notLogged.filter(mine).length;
      return {
        id: u.id,
        name: u.name,
        area: (u.nutritionist?.areas ?? []).join(', '),
        clients: await Parent.countDocuments({ nutritionist: u.id }),
        week: myWeek.length,
        weekDone: myWeek.filter((v) => v.status === 'completed').length,
        notLogged: late,
        onTime: await notesOnTime({ nutritionist: u.id }),
        active: u.active !== false,
        ...statusFor(u, late),
      };
    }),
  );
}

export async function detail(id) {
  const u = await User.findOne({ _id: id, role: 'nutritionist' });
  if (!u) throw ApiError.notFound('Nutritionist not found');
  const [parents, week, late, onTime, notes] = await Promise.all([
    Parent.find({ nutritionist: u.id }).sort('fullName'),
    visitsThisWeek({ nutritionist: u.id }).populate('parent', 'fullName short family'),
    notLoggedVisits({ nutritionist: u.id }),
    notesOnTime({ nutritionist: u.id }),
    Notification.find({ user: u.id }).sort('-createdAt').limit(10),
  ]);
  const families = await Family.find({ _id: { $in: parents.map((p) => p.family) } }).populate('mainContact', 'name city');
  const famBy = Object.fromEntries(families.map((f) => [f.id, f]));
  const clients = await Promise.all(
    parents.map(async (p) => {
      const v = await visitSummary(p);
      const f = famBy[String(p.family)];
      return { id: p.id, familyId: String(p.family), name: p.fullName, area: p.area, status: p.overall, family: f ? `${f.mainContact?.name ?? ''} · ${f.mainContact?.city ?? ''}` : '', last: v.lastVisit, next: v.nextVisit };
    }),
  );
  const n = u.nutritionist ?? {};
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    active: u.active !== false,
    profile: {
      credential: n.credential ?? '',
      languages: n.languages ?? '',
      areas: n.areas ?? [],
      availability: n.availability ?? 'active',
      leaveUntil: n.leaveUntil ?? null,
      licenceRenewsOn: n.licenceRenewsOn ?? null,
    },
    ...statusFor(u, late.length),
    onTime,
    clients,
    week: week
      .sort((a, b) => a.scheduledFor - b.scheduledFor)
      .map((v) => ({
        id: v.id,
        at: v.scheduledFor,
        parent: v.parent?.fullName,
        familyId: v.parent ? String(v.parent.family) : null,
        state: v.status === 'completed' ? 'done' : isNotLogged(v) ? 'not_logged' : 'upcoming',
      })),
    notLogged: late.map((v) => ({ id: v.id, at: v.scheduledFor, parent: v.parent?.fullName, familyId: v.parent ? String(v.parent.family) : null })),
    notices: notes.map((x) => ({ id: x.id, title: x.title, body: x.body, from: x.from, read: x.read, at: x.createdAt })),
  };
}

export async function create(admin, { name, email, phone, credential, languages, areas }) {
  if (await User.exists({ email })) throw ApiError.badRequest('There is already an account with that email.');
  const password = tempPassword();
  const user = new User({ name, email, phone, role: 'nutritionist', city: 'Lahore', nutritionist: { credential, languages, areas, availability: 'active' } });
  await user.setPassword(password);
  await user.save();
  await record(admin, 'team.create', `Added nutritionist ${name}`, { kind: 'user', id: user._id, label: name });
  return { id: user.id, tempPassword: password };
}

export async function update(admin, id, input) {
  const u = await User.findOne({ _id: id, role: 'nutritionist' });
  if (!u) throw ApiError.notFound('Nutritionist not found');
  if (input.phone !== undefined) u.phone = input.phone || undefined;
  const n = u.nutritionist ?? {};
  for (const k of ['credential', 'languages', 'areas', 'availability', 'leaveUntil', 'licenceRenewsOn']) {
    if (input[k] !== undefined) n[k] = input[k] || undefined;
  }
  if (n.availability !== 'on_leave') n.leaveUntil = undefined;
  u.nutritionist = n;
  await u.save();
  const what = input.availability === 'on_leave' ? 'Put on leave' : input.availability === 'active' ? 'Back from leave' : 'Updated profile';
  await record(admin, 'team.update', `${what}: ${u.name}`, { kind: 'user', id: u._id, label: u.name });
  return detail(id);
}
