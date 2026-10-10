import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Family, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizePhone } from '../utils/phone.js';
import { signToken } from '../middleware/auth.js';
import { sendSms, smsEnabled } from './sms.service.js';

const CODE_TTL_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const session = (user) => ({ token: signToken(user), user: user.toPublic() });

export async function login({ email, password, role }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await user.checkPassword(password));
  if (!ok) throw ApiError.unauthorized("That email and password don't match. Check them and try again.");
  if (user.active === false) throw ApiError.unauthorized('This account has been turned off. Contact Kinwell support.', 'account_inactive');
  if (role && user.role !== role) {
    throw ApiError.unauthorized(`This account isn't a ${role} account. Choose the right role above.`);
  }
  return session(user);
}

/** Creates a fresh 6-digit code for a parent account and stores its hash. */
export async function issueParentCode(parentUser) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  parentUser.loginCode = { hash: await bcrypt.hash(code, 8), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0 };
  await parentUser.save();
  return { code, expiresAt: parentUser.loginCode.expiresAt };
}

/**
 * Parent asks for a code. With an SMS provider the code is texted. Without one,
 * the parent is told to get it from their family, who can create it in their app.
 * The response is the same whether or not the number exists.
 */
export async function requestParentCode({ phone }) {
  const user = await User.findOne({ phone: normalizePhone(phone), role: 'parent' });
  if (smsEnabled()) {
    if (user) {
      const { code } = await issueParentCode(user);
      await sendSms(user.phone, `Your Kinwell code is ${code}. It works for 30 minutes.`);
    }
    return { delivery: 'sms' };
  }
  // No SMS yet. In development, hand back a code so the flow can be tested end to end,
  // but never replace a code the family has already created and passed on.
  const hasActiveCode = user?.loginCode?.expiresAt > new Date();
  if (process.env.NODE_ENV !== 'production' && user && !hasActiveCode) {
    const { code } = await issueParentCode(user);
    return { delivery: 'family', devCode: code };
  }
  return { delivery: 'family' };
}

export async function verifyParentCode({ phone, code }) {
  const user = await User.findOne({ phone: normalizePhone(phone), role: 'parent' }).select('+loginCode.hash');
  if (user && user.active === false) throw ApiError.unauthorized('This account has been turned off. Ask your family to contact Kinwell.', 'account_inactive');
  const lc = user?.loginCode;
  if (!lc?.hash || lc.expiresAt <= new Date()) throw ApiError.unauthorized('That code has expired. Ask your family for a new one.', 'code_expired');
  if ((lc.attempts ?? 0) >= MAX_ATTEMPTS) throw ApiError.unauthorized('Too many wrong tries. Ask your family for a new code.', 'code_locked');
  if (!(await bcrypt.compare(code, lc.hash))) {
    user.loginCode.attempts = (lc.attempts ?? 0) + 1;
    await user.save();
    throw ApiError.unauthorized("That code didn't work. Check it and try again.", 'code_wrong');
  }
  user.loginCode = undefined;
  await user.save();
  return session(user);
}

export async function requestPasswordReset({ email }) {
  // Always succeed so the endpoint can't be used to discover accounts.
  await User.exists({ email });
  return { sent: true };
}

export async function setLanguage(user, { language }) {
  user.language = language;
  await user.save();
  return { user: user.toPublic() };
}

export async function logout(user, { everywhere }) {
  if (everywhere) {
    user.tokenVersion += 1;
    await user.save();
  }
  return { signedOut: true };
}

// ---------- Joining a family from an invite link ----------

async function findInvite(token) {
  const family = await Family.findOne({ members: { $elemMatch: { inviteToken: token, status: 'invited' } } }).populate('mainContact', 'name');
  const member = family?.members.find((m) => m.inviteToken === token);
  if (!member) throw ApiError.notFound('This invite link has expired or was already used. Ask your family to send a new one.', 'invite_invalid');
  return { family, member };
}

export async function getInvite(token) {
  const { family, member } = await findInvite(token);
  return { family: family.name, invitedBy: family.mainContact?.name, email: member.email, relation: member.relation, access: member.access };
}

export async function acceptInvite({ token, name, password, city }) {
  const { family, member } = await findInvite(token);
  if (await User.exists({ email: member.email })) throw ApiError.badRequest('There is already an account with this email. Sign in instead.');
  const user = new User({ name, email: member.email, role: 'family', city, family: family.id });
  await user.setPassword(password);
  await user.save();
  Object.assign(member, { user: user.id, status: 'active', inviteToken: undefined });
  await family.save();
  return session(user);
}
