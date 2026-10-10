import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AccessRequest, DailyLog, Family, Flag, Notification, Parent, User, Visit } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { STATUS_RANK, worstStatus } from '../../utils/status.js';
import { dateKeyDaysAgo } from '../../utils/time.js';
import { visitSummary } from '../parent.service.js';
import { list as auditList, record } from './audit.js';
import { flagView } from './flags.js';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const relativeDay = (date) => {
  if (!date) return '—';
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
};
const parentLabel = (p) => `${p.short && p.short !== p.fullName ? p.short : p.fullName.split(' ')[0]} ${p.age ?? ''}`.trim();

export const newInviteToken = () => crypto.randomBytes(18).toString('base64url');
export const inviteLink = (token) => `${env.publicUrl}/join/${token}`;

/** Families matching a search, status and nutritionist filter, a page at a time. */
export async function list({ q = '', status, nutritionist, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (nutritionist) filter.nutritionist = nutritionist;
  if (q.trim()) {
    const rx = new RegExp(escape(q.trim()), 'i');
    const [parents, users] = await Promise.all([
      Parent.find({ $or: [{ fullName: rx }, { short: rx }] }, 'family'),
      User.find({ role: 'family', $or: [{ name: rx }, { email: rx }] }, 'family'),
    ]);
    filter.$or = [{ name: rx }, { _id: { $in: [...parents.map((p) => p.family), ...users.map((u) => u.family)].filter(Boolean) } }];
  }

  const all = await Family.find(filter).sort('name').populate('mainContact', 'name city').populate('nutritionist', 'name');
  const parents = await Parent.find({ family: { $in: all.map((f) => f.id) } }, 'family short fullName age overall');
  const byFamily = new Map();
  for (const p of parents) {
    const k = String(p.family);
    if (!byFamily.has(k)) byFamily.set(k, []);
    byFamily.get(k).push(p);
  }
  let rows = all.map((f) => {
    const ps = byFamily.get(f.id) ?? [];
    return {
      id: f.id,
      family: f.name,
      contact: f.mainContact ? `${f.mainContact.name} · ${f.mainContact.city ?? ''}` : '—',
      parents: ps.map(parentLabel).join(', '),
      nutritionist: f.nutritionist?.name ?? 'Not assigned',
      nutritionistId: f.nutritionist?.id ?? null,
      status: ps.length ? worstStatus(ps.map((p) => p.overall)) : 'normal',
      last: relativeDay(f.lastActivityAt ?? f.updatedAt),
    };
  });
  if (status) rows = rows.filter((r) => r.status === status);
  rows.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || a.family.localeCompare(b.family));
  const total = rows.length;
  return { items: rows.slice((page - 1) * limit, page * limit), page, pages: Math.max(1, Math.ceil(total / limit)), total };
}

/** Share of the last 7 days' supplements that were ticked off (0–100), or null. */
async function adherence7d(parentId) {
  const keys = [1, 2, 3, 4, 5, 6, 7].map((n) => dateKeyDaysAgo(n));
  const logs = await DailyLog.find({ parent: parentId, date: { $in: keys } });
  const supps = logs.flatMap((l) => l.items.filter((i) => i.kind === 'supp'));
  return supps.length ? Math.round((supps.filter((i) => i.done).length / supps.length) * 100) : null;
}

export async function detail(id) {
  const family = await Family.findById(id).populate('mainContact', 'name email phone city').populate('nutritionist', 'name').populate('members.user', 'name email phone city active');
  if (!family) throw ApiError.notFound('Family not found');
  const parents = await Parent.find({ family: family.id }).populate('nutritionist', 'name');
  const parentIds = parents.map((p) => p._id);

  const [parentRows, flags, requests, activity] = await Promise.all([
    Promise.all(
      parents.map(async (p) => {
        const [visits, adherence, parentUser] = await Promise.all([visitSummary(p), adherence7d(p.id), User.findOne({ role: 'parent', parent: p.id }, 'phone active loginCode.attempts loginCode.expiresAt')]);
        return {
          id: p.id,
          fullName: p.fullName,
          short: p.short,
          age: p.age,
          area: p.area,
          overall: p.overall,
          overallTitle: p.overallTitle,
          nutritionist: p.nutritionist ? { id: p.nutritionist.id, name: p.nutritionist.name } : null,
          lastVisit: visits.lastVisit,
          nextVisit: visits.nextVisit,
          adherence,
          openAlerts: (p.alerts ?? []).filter((a) => !a.resolved).length,
          account: parentUser && { id: parentUser.id, phone: parentUser.phone, active: parentUser.active, locked: (parentUser.loginCode?.attempts ?? 0) >= 5 },
        };
      }),
    ),
    Flag.find({ $or: [{ 'link.family': family._id }, { 'link.parent': { $in: parentIds } }] }).sort('-createdAt').populate('link.user', 'name email phone').populate('resolvedBy', 'name'),
    AccessRequest.find({ family: family._id }).sort('-createdAt'),
    auditList({ limit: 15, targetIds: [family._id, ...parentIds] }),
  ]);

  return {
    id: family.id,
    name: family.name,
    createdAt: family.createdAt,
    mainContact: family.mainContact && { id: family.mainContact.id, name: family.mainContact.name, email: family.mainContact.email, phone: family.mainContact.phone, city: family.mainContact.city },
    nutritionist: family.nutritionist && { id: family.nutritionist.id, name: family.nutritionist.name },
    members: family.members.map((m) => ({
      userId: m.user?.id ?? null,
      name: m.user?.name ?? null,
      email: m.user?.email ?? m.email,
      phone: m.user?.phone ?? null,
      city: m.user?.city ?? null,
      relation: m.relation,
      access: m.access,
      status: m.status,
      active: m.user ? m.user.active !== false : null,
      invitedAt: m.invitedAt,
    })),
    parents: parentRows,
    flags: flags.map(flagView),
    accessRequests: requests.map((r) => ({ id: r.id, name: r.name, email: r.email, relation: r.relation, access: r.access, status: r.status, createdAt: r.createdAt })),
    activity: activity.items,
  };
}

/**
 * Moves a family (or one parent) to another nutritionist, including their upcoming visits,
 * and lets the new nutritionist know.
 */
export async function assignNutritionist(admin, familyId, { nutritionistId, parentId }) {
  const [family, nut] = await Promise.all([Family.findById(familyId), User.findOne({ _id: nutritionistId, role: 'nutritionist' })]);
  if (!family) throw ApiError.notFound('Family not found');
  if (!nut || nut.active === false) throw ApiError.badRequest('Choose an active nutritionist.');
  const parentFilter = parentId ? { _id: parentId, family: family.id } : { family: family.id };
  const parents = await Parent.find(parentFilter);
  if (!parents.length) throw ApiError.notFound('Parent not found');

  await Parent.updateMany(parentFilter, { nutritionist: nut.id });
  await Visit.updateMany({ parent: { $in: parents.map((p) => p.id) }, status: { $in: ['scheduled', 'reschedule_requested'] }, scheduledFor: { $gte: new Date() } }, { nutritionist: nut.id });
  if (!parentId) family.nutritionist = nut.id;
  await family.save();

  const who = parents.map((p) => p.fullName).join(' and ');
  await Notification.create({ user: nut.id, title: `New client${parents.length > 1 ? 's' : ''}: ${who}`, body: `You are now looking after ${who} (${family.name}).`, from: admin.name });
  await record(admin, 'family.assign', `Assigned ${who} (${family.name}) to ${nut.name}`, { kind: 'family', id: family._id, label: family.name });
  return detail(family.id);
}

/** Creates a fresh join link for an invited member (there's no email service yet, so the admin shares it). */
export async function resendInvite(admin, familyId, { email }) {
  const family = await Family.findById(familyId);
  const member = family?.members.find((m) => m.status === 'invited' && m.email === email);
  if (!member) throw ApiError.notFound('No pending invite for that email');
  member.inviteToken = newInviteToken();
  member.invitedAt = new Date();
  await family.save();
  await record(admin, 'family.invite', `Made a new invite link for ${email} (${family.name})`, { kind: 'family', id: family._id, label: family.name });
  return { email, link: inviteLink(member.inviteToken) };
}
