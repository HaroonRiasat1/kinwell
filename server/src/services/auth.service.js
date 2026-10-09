import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../middleware/auth.js';

const session = (user) => ({ token: signToken(user), user: user.toPublic() });

export async function login({ email, password, role }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await user.checkPassword(password));
  if (!ok) throw ApiError.unauthorized("That email and password don't match. Check them and try again.");
  if (role && user.role !== role) {
    throw ApiError.unauthorized(`This account isn't a ${role} account. Choose the right role above.`);
  }
  return session(user);
}

// Parents sign in with a 6-digit code sent by text message.
export async function requestParentCode({ phone }) {
  const user = await User.findOne({ phone, role: 'parent' });
  // Respond the same way whether or not the number exists.
  if (!user) return { sent: true };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  user.loginCode = { hash: await bcrypt.hash(code, 8), expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
  await user.save();
  // No SMS provider is wired up yet; in development the code is returned so the flow can be tested.
  return { sent: true, ...(process.env.NODE_ENV !== 'production' && { devCode: code }) };
}

export async function verifyParentCode({ phone, code }) {
  const user = await User.findOne({ phone, role: 'parent' }).select('+loginCode.hash');
  const valid =
    user?.loginCode?.hash && user.loginCode.expiresAt > new Date() && (await bcrypt.compare(code, user.loginCode.hash));
  if (!valid) throw ApiError.unauthorized("That code didn't work. Check the text message and try again.");
  user.loginCode = undefined;
  await user.save();
  return session(user);
}

export async function requestPasswordReset({ email }) {
  // Always succeed so the endpoint can't be used to discover accounts.
  await User.exists({ email });
  return { sent: true };
}

export async function logout(user, { everywhere }) {
  if (everywhere) {
    user.tokenVersion += 1;
    await user.save();
  }
  return { signedOut: true };
}
