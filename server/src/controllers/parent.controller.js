import * as svc from '../services/parent.service.js';
import { assertCanEdit, loadParentFor } from '../services/access.service.js';

// Every handler below works on one parent the user is allowed to see.
const withParent = (fn) => async (req, res) => {
  const parent = await loadParentFor(req.user, req.params.parentId);
  res.json(await fn(parent, req));
};
const withEditableParent = (fn) => async (req, res) => {
  const parent = await loadParentFor(req.user, req.params.parentId);
  assertCanEdit(req.user, parent);
  res.json(await fn(parent, req));
};

export const list = async (req, res) => res.json(await svc.listParentsForUser(req.user));
export const threads = async (req, res) => res.json(await svc.threadsForUser(req.user));

export const dashboard = withParent((p) => svc.getDashboard(p));
export const home = withParent((p) => svc.getParentHome(p));
export const profile = withParent((p) => svc.getProfile(p));
export const labs = withParent((p) => svc.getLabs(p));
export const nutrition = withParent((p) => svc.getNutrition(p));
export const supplements = withParent((p) => svc.getSupplements(p));
export const visits = withParent((p) => svc.getVisits(p));
export const documents = withParent((p) => svc.getDocuments(p));
export const messages = withParent((p, req) => svc.getMessages(p, req.user));

export const toggleChecklist = withEditableParent((p, req) => svc.setChecklistItem(p, req.params.code, req.body.done));
export const setReminder = withEditableParent((p, req) => svc.setReminder(p, req.body.slot, req.body.on));
export const reschedule = withEditableParent((p, req) => svc.requestReschedule(p, req.body));
export const uploadReport = withEditableParent((p, req) => svc.addLabReport(p, req.user, req.body));
export const postMessage = withParent((p, req) => svc.postMessage(p, req.user, req.body));
export const signInCode = withParent((p) => svc.createParentSignInCode(p));
