import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status ?? 500;
  let message = err.message ?? 'Something went wrong';
  if (err instanceof mongoose.Error.CastError) { status = 400; message = 'Invalid id'; }
  if (err instanceof mongoose.Error.ValidationError) { status = 400; }
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: { message: status >= 500 && !(err instanceof ApiError) ? 'Something went wrong on our side' : message, details: err.details, code: err.code },
  });
};
