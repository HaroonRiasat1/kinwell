import * as svc from '../services/workspace.service.js';

export const clients = async (req, res) => res.json(await svc.listClients(req.user));
export const visitContext = async (req, res) => res.json(await svc.getVisitContext(req.user, req.params.parentId));
export const logVisit = async (req, res) => res.status(201).json(await svc.logVisit(req.user, req.params.parentId, req.body));
export const library = async (_req, res) => res.json(await svc.getBuilderLibrary());
export const savePlan = async (req, res) => res.json(await svc.savePlanDay(req.user, req.params.parentId, req.body));
export const sendUpdate = async (req, res) => res.status(201).json(await svc.sendFamilyUpdate(req.user, req.params.parentId, req.body));
