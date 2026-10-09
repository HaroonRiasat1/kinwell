import { Router } from 'express';
import * as raw from '../controllers/parent.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();
router.use(requireAuth);

router.get('/', c.list);
router.get('/threads', c.threads);
router.get('/:parentId/dashboard', c.dashboard);
router.get('/:parentId/home', c.home);
router.get('/:parentId/profile', c.profile);
router.get('/:parentId/labs', c.labs);
router.post('/:parentId/labs/reports', validate(s.uploadSchema), c.uploadReport);
router.get('/:parentId/nutrition', c.nutrition);
router.get('/:parentId/supplements', c.supplements);
router.patch('/:parentId/supplements/reminders', validate(s.reminderSchema), c.setReminder);
router.patch('/:parentId/checklist/:code', validate(s.checklistSchema), c.toggleChecklist);
router.get('/:parentId/visits', c.visits);
router.post('/:parentId/visits/reschedule', validate(s.rescheduleSchema), c.reschedule);
router.get('/:parentId/documents', c.documents);
router.get('/:parentId/messages', c.messages);
router.post('/:parentId/messages', validate(s.messageSchema), c.postMessage);

export default router;
