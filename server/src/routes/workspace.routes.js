import { Router } from 'express';
import * as raw from '../controllers/workspace.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();
router.use(requireAuth, requireRole('nutritionist'));

router.get('/today', c.today);
router.post('/requests/:visitId', validate(s.rescheduleDecisionSchema), c.decideReschedule);
router.get('/inbox', c.inbox);
router.get('/notifications', c.notifications);
router.post('/notifications/:id/read', c.readNotification);

router.get('/library', c.library);
router.get('/clients', c.clients);
router.get('/clients/:parentId', c.client);
router.get('/clients/:parentId/visit', c.visitContext);
router.post('/clients/:parentId/visits', validate(s.visitLogSchema), c.logVisit);
router.get('/clients/:parentId/plan', c.plan);
router.put('/clients/:parentId/plan', validate(s.planWeekSchema), c.savePlan);
router.post('/clients/:parentId/plan/publish', c.publishPlan);
router.post('/clients/:parentId/updates', validate(s.familyUpdateSchema), c.sendUpdate);

export default router;
