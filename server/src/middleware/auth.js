import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Parents stay signed in for 90 days so they rarely need a new code.
export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, env.jwtSecret, {
    expiresIn: user.role === 'parent' ? '90d' : env.jwtExpiresIn,
  });

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) throw ApiError.unauthorized();
  if (user.active === false) throw ApiError.unauthorized('This account has been turned off. Contact Kinwell support.', 'account_inactive');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};
