import { Family, Flag, Parent, ServiceArea, User, Visit } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfWeek, weekdayIndex } from '../utils/time.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function visitsThisWeek() {
  const from = startOfWeek();
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 7);
  return Visit.find({ scheduledFor: { $gte: from, $lt: to } }, 'status scheduledFor nutritionist');
}

export async function overview() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [families, newFamilies, flags, visits, areas] = await Promise.all([
    Family.countDocuments(),
    Family.countDocuments({ createdAt: { $gte: monthAgo } }),
    Flag.find({ resolved: false }).sort('-createdAt'),
    visitsThisWeek(),
    ServiceArea.find().sort('name'),
  ]);

  const today = weekdayIndex();
  const weekBars = DAY_NAMES.map((d, i) => {
    const day = visits.filter((v) => weekdayIndex(v.scheduledFor) === i);
    return { day: i === today ? 'Today' : d, done: day.filter((v) => v.status === 'completed').length, booked: day.length, isToday: i === today };
  });
  const done = visits.filter((v) => v.status === 'completed').length;

  return {
    stats: [
      { label: 'Active families', value: String(families), note: `${newFamilies} joined this month` },
      { label: 'Visits this week', value: String(done), note: `of ${visits.length} booked` },
      { label: 'Open flags', value: String(flags.length), note: `${flags.filter((f) => f.status === 'attention').length} need action today` },
      { label: 'Time to family update', value: '5.2 h', note: 'Average · target under 24 h' },
    ],
    queue: flags.map((f) => ({ id: f.id, status: f.status, type: f.type, title: f.title, meta: f.meta, action: f.action })),
    weekBars,
    coverage: areas.map((a) => {
      const pct = a.activeClients / a.capacity;
      const status = pct > 0.95 ? 'attention' : pct > 0.8 ? 'watch' : 'normal';
      return { area: a.name, clients: a.activeClients, capacity: a.capacity, pct: Math.round(pct * 100), status };
    }),
  };
}

export async function resolveFlag(admin, id) {
  const flag = await Flag.findByIdAndUpdate(id, { resolved: true, resolvedBy: admin.id, resolvedAt: new Date() }, { new: true });
  if (!flag) throw ApiError.notFound('Flag not found');
  return { id: flag.id, resolved: true };
}

export async function team() {
  const [people, visits] = await Promise.all([User.find({ role: 'nutritionist' }).sort('name'), visitsThisWeek()]);
  return Promise.all(
    people.map(async (u) => {
      const n = u.nutritionist ?? {};
      const clients = await Parent.countDocuments({ nutritionist: u.id });
      const week = visits.filter((v) => String(v.nutritionist) === String(u.id)).length;
      let status = 'normal';
      let label = 'Active';
      if (n.availability === 'on_leave') label = `On leave${n.nextOpening ? ` until ${n.nextOpening}` : ''}`;
      else if (n.licenceRenewsOn && n.licenceRenewsOn - Date.now() < 30 * 24 * 3600 * 1000) {
        status = 'watch';
        label = `Licence due ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(n.licenceRenewsOn)}`;
      }
      const notLogged = await Visit.countDocuments({ nutritionist: u.id, status: 'in_progress' });
      if (notLogged) {
        status = 'watch';
        label = `${notLogged} visit not logged`;
      }
      return { id: u.id, name: u.name, area: (n.areas ?? []).join(', '), clients, week, onTime: n.onTimeRate ?? '—', status, label };
    }),
  );
}

export async function families() {
  const list = await Family.find().populate('mainContact').populate('nutritionist').sort('name');
  return Promise.all(
    list.map(async (f) => {
      const parents = await Parent.find({ family: f.id }, 'short fullName age');
      return {
        id: f.id,
        family: f.name,
        contact: `${f.mainContact?.name ?? ''} · ${f.mainContact?.city ?? ''}`,
        parents: parents.map((p) => `${p.short === p.fullName ? p.fullName.split(' ')[0] : p.short} ${p.age}`).join(', '),
        nutritionist: f.nutritionist?.name ?? 'Not assigned',
        status: f.status,
        last: f.lastActivityAt ? relativeDay(f.lastActivityAt) : '—',
      };
    }),
  );
}

function relativeDay(date) {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
