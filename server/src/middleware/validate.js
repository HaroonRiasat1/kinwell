import { ApiError } from '../utils/ApiError.js';

// Validates req[source] against a zod schema and replaces it with the parsed value.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(ApiError.badRequest('Please check the highlighted fields', result.error.flatten().fieldErrors));
  }
  req[source] = result.data;
  next();
};
