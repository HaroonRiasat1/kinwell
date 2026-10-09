import { Router } from 'express';
import * as raw from '../controllers/onboarding.controller.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();

router.get('/nutritionists', c.nutritionists);
router.post('/', validate(s.onboardingSchema), c.complete);

export default router;
