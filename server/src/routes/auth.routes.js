import { Router } from 'express';
import * as raw from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();

router.post('/login', validate(s.loginSchema), c.login);
router.post('/parent-code', validate(s.parentCodeRequestSchema), c.requestParentCode);
router.post('/parent-code/verify', validate(s.parentCodeVerifySchema), c.verifyParentCode);
router.post('/forgot', validate(s.forgotSchema), c.forgot);
router.post('/logout', requireAuth, validate(s.logoutSchema), c.logout);
router.get('/me', requireAuth, c.me);
router.patch('/me/language', requireAuth, validate(s.languageSchema), c.setLanguage);

export default router;
