import { asyncHandler } from '../utils/asyncHandler.js';

// Wraps every handler in an object of controllers so async errors reach the error middleware.
export const wrapAll = (controllers) =>
  Object.fromEntries(Object.entries(controllers).map(([k, fn]) => [k, asyncHandler(fn)]));
