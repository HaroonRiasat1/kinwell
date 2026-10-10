import * as svc from '../services/workspace.service.js';

const pid = (req) => req.params.parentId;

export const today = async (req, res) => res.json(await svc.today(req.user));
export const decideReschedule = async (req, res) => res.json(await svc.decideReschedule(req.user, req.params.visitId, req.body));
export const inbox = async (req, res) => res.json(await svc.inbox(req.user));

export const clients = async (req, res) => res.json(await svc.listClients(req.user));
export const client = async (req, res) => res.json(await svc.clientSummary(req.user, pid(req)));
export const visitContext = async (req, res) => res.json(await svc.getVisitContext(req.user, pid(req)));
export const logVisit = async (req, res) => res.status(201).json(await svc.logVisit(req.user, pid(req), req.body));

export const library = async (_req, res) => res.json(await svc.getBuilderLibrary());
export const plan = async (req, res) => res.json(await svc.getPlan(req.user, pid(req)));
export const savePlan = async (req, res) => res.json(await svc.savePlan(req.user, pid(req), req.body));
export const publishPlan = async (req, res) => res.json(await svc.publishPlan(req.user, pid(req)));

export const sendUpdate = async (req, res) => res.status(201).json(await svc.sendFamilyUpdate(req.user, pid(req), req.body));
export const notifications = async (req, res) => res.json(await svc.notifications(req.user));
export const readNotification = async (req, res) => res.json(await svc.markNotificationRead(req.user, req.params.id));
