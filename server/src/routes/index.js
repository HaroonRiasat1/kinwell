import { Router } from 'express';
import authRoutes from './auth.routes.js';
import parentRoutes from './parent.routes.js';
import workspaceRoutes from './workspace.routes.js';
import adminRoutes from './admin.routes.js';
import onboardingRoutes from './onboarding.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/parents', parentRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/admin', adminRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;
