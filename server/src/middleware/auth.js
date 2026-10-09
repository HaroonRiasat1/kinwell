import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

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
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};
