import { Router } from 'express';
import * as raw from '../controllers/workspace.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();
router.use(requireAuth, requireRole('nutritionist'));

router.get('/clients', c.clients);
router.get('/library', c.library);
router.get('/clients/:parentId/visit', c.visitContext);
router.post('/clients/:parentId/visits', validate(s.visitLogSchema), c.logVisit);
router.put('/clients/:parentId/plan', validate(s.planDaySchema), c.savePlan);
router.post('/clients/:parentId/updates', validate(s.familyUpdateSchema), c.sendUpdate);

export default router;
