// Nutritionist workspace. Split by area; this file re-exports for the controller.
export { listClients, clientSummary, getVisitContext, notifications, markNotificationRead } from './workspace/clients.js';
export { logVisit, today, decideReschedule } from './workspace/visits.js';
export { getBuilderLibrary, getPlan, savePlan, publishPlan } from './workspace/plans.js';
export { inbox } from './workspace/inbox.js';
export { sendFamilyUpdate } from './workspace/updates.js';
