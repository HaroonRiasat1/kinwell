import { Family, Parent, User } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { issueParentCode } from '../auth.service.js';
import { record } from './audit.js';
import { tempPassword } from './team.js';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const accountView = (u, familyName, parentName) => ({
  id: u.id,
  name: u.name,
  email: u.email ?? null,
  phone: u.phone ?? null,
  role: u.role,
  active: u.active !== false,
  family: familyName ?? null,
  familyId: u.family ? String(u.family) : null,
  parentOf: parentName ?? null,
  locked: u.role === 'parent' && (u.loginCode?.attempts ?? 0) >= 5,
  createdAt: u.createdAt,
});

export async function list({ q = '', role, page = 1, limit = 25 } = {}) {
  const filter = {};
  if (role) filter.role = role;
  if (q.trim()) {
    const rx = new RegExp(escape(q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: new RegExp(escape(q.replace(/\D/g, '') || q), 'i') }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('+loginCode.attempts').sort('role name').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const families = await Family.find({ _id: { $in: users.map((u) => u.family).filter(Boolean) } }, 'name');
  const parents = await Parent.find({ _id: { $in: users.map((u) => u.parent).filter(Boolean) } }, 'fullName');
  const fam = Object.fromEntries(families.map((f) => [f.id, f.name]));
  const par = Object.fromEntries(parents.map((p) => [p.id, p.fullName]));
  return {
    items: users.map((u) => accountView(u, fam[String(u.family)], par[String(u.parent)])),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

const load = async (id) => {
  const u = await User.findById(id);
  if (!u) throw ApiError.notFound('Account not found');
  return u;
};

/** New one-time password for an email account; signs the person out everywhere. */
export async function resetPassword(admin, id) {
  const u = await load(id);
  if (u.role === 'parent') throw ApiError.badRequest('Parents sign in with a code, not a password. Make them a sign-in code instead.');
  const password = tempPassword();
  await u.setPassword(password);
  u.tokenVersion += 1;
  await u.save();
  await record(admin, 'account.reset', `Reset the password for ${u.name}`, { kind: 'user', id: u._id, label: u.name });
  return { tempPassword: password };
}

export async function signOutEverywhere(admin, id) {
  const u = await load(id);
  u.tokenVersion += 1;
  await u.save();
  await record(admin, 'account.signout', `Signed ${u.name} out on all devices`, { kind: 'user', id: u._id, label: u.name });
  return { done: true };
}

/** Clears a parent's wrong-code lockout and gives support a fresh code to read out. */
export async function parentCode(admin, id) {
  const u = await load(id);
  if (u.role !== 'parent') throw ApiError.badRequest('Only parents sign in with a code.');
  const { code, expiresAt } = await issueParentCode(u);
  await record(admin, 'account.code', `Made a sign-in code for ${u.name}`, { kind: 'user', id: u._id, label: u.name });
  return { code, expiresAt, phone: u.phone };
}

export async function setActive(admin, id, active) {
  const u = await load(id);
  if (u.id === admin.id) throw ApiError.badRequest("You can't turn off your own account.");
  if (!active && u.role === 'nutritionist') {
    const clients = await Parent.countDocuments({ nutritionist: u.id });
    if (clients) throw ApiError.badRequest(`Move ${u.name}'s ${clients} client${clients > 1 ? 's' : ''} to another nutritionist first.`);
  }
  u.active = active;
  if (!active) u.tokenVersion += 1; // sign them out now
  await u.save();
  await record(admin, active ? 'account.activate' : 'account.deactivate', `${active ? 'Turned on' : 'Turned off'} the account for ${u.name}`, { kind: 'user', id: u._id, label: u.name });
  return accountView(u);
}
