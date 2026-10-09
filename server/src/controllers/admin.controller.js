import * as svc from '../services/admin.service.js';

export const overview = async (_req, res) => res.json(await svc.overview());
export const team = async (_req, res) => res.json(await svc.team());
export const families = async (_req, res) => res.json(await svc.families());
export const resolveFlag = async (req, res) => res.json(await svc.resolveFlag(req.user, req.params.id));
