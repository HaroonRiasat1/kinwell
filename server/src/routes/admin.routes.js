import { Router } from 'express';
import * as raw from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';
import { wrapAll } from './helpers.js';

const c = wrapAll(raw);
const router = Router();
router.use(requireAuth, requireRole('admin'));
const q = validate(s.adminListQuery, 'query');

router.get('/overview', c.overview);

router.get('/flags', q, c.listFlags);
router.post('/flags/:id/resolve', validate(s.flagResolveSchema), c.resolveFlag);
router.post('/flags/:id/reopen', c.reopenFlag);
router.post('/flags/:id/notes', validate(s.flagNoteSchema), c.noteFlag);
router.post('/flags/:id/remind', validate(s.flagRemindSchema), c.remindFlag);

router.get('/families', q, c.listFamilies);
router.get('/families/:id', c.family);
router.put('/families/:id/nutritionist', validate(s.assignSchema), c.assign);
router.post('/families/:id/invites', validate(s.inviteSchema), c.resendInvite);

router.get('/nutritionists', q, c.listTeam);
router.post('/nutritionists', validate(s.nutritionistCreateSchema), c.createNutritionist);
router.get('/nutritionists/:id', c.nutritionist);
router.patch('/nutritionists/:id', validate(s.nutritionistUpdateSchema), c.updateNutritionist);

router.get('/accounts', q, c.listAccounts);
router.post('/accounts/:id/reset-password', c.resetPassword);
router.post('/accounts/:id/sign-out', c.signOutEverywhere);
router.post('/accounts/:id/parent-code', c.parentCode);
router.put('/accounts/:id/active', validate(s.activeSchema), c.setActive);

router.get('/lab-uploads', c.labUploads);
router.post('/lab-uploads/:id', validate(s.labActionSchema), c.labUploadAction);
router.get('/access-requests', c.accessRequests);
router.post('/access-requests/:id', validate(s.accessDecisionSchema), c.decideAccess);

router.get('/areas', c.areas);
router.put('/areas', validate(s.areaSchema), c.saveArea);
router.delete('/areas/:id', c.removeArea);

router.get('/activity', c.activity);

export default router;
