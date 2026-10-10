import { DEFAULT_LANGUAGE, pickLanguage } from '../i18n/index.js';

// Picks the response language: the X-Language header the app sends, then
// Accept-Language, then English.
export const detectLanguage = (req, _res, next) => {
  req.lang = pickLanguage(req.headers['x-language']) ?? pickLanguage(req.headers['accept-language']) ?? DEFAULT_LANGUAGE;
  next();
};
