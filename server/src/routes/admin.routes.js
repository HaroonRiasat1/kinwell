import { Router } from 'express';
import * as raw from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', c.overview);
router.get('/nutritionists', c.team);
router.get('/families', c.families);
router.post('/flags/:id/resolve', c.resolveFlag);

export default router;
