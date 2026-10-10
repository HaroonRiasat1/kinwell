import { overview as getOverview } from '../services/admin/overview.js';
import * as flags from '../services/admin/flags.js';
import * as families from '../services/admin/families.js';
import * as team from '../services/admin/team.js';
import * as accounts from '../services/admin/accounts.js';
import * as queues from '../services/admin/queues.js';
import * as settings from '../services/admin/settings.js';
import * as audit from '../services/admin/audit.js';

const id = (req) => req.params.id;

export const overview = async (_req, res) => res.json(await getOverview());

export const listFlags = async (req, res) => res.json(await flags.list(req.query));
export const resolveFlag = async (req, res) => res.json(await flags.resolve(req.user, id(req), req.body));
export const reopenFlag = async (req, res) => res.json(await flags.reopen(req.user, id(req)));
export const noteFlag = async (req, res) => res.json(await flags.addNote(req.user, id(req), req.body));
export const remindFlag = async (req, res) => res.json(await flags.remind(req.user, id(req), req.body));

export const listFamilies = async (req, res) => res.json(await families.list(req.query));
export const family = async (req, res) => res.json(await families.detail(id(req)));
export const assign = async (req, res) => res.json(await families.assignNutritionist(req.user, id(req), req.body));
export const resendInvite = async (req, res) => res.json(await families.resendInvite(req.user, id(req), req.body));

export const listTeam = async (req, res) => res.json(await team.list(req.query));
export const nutritionist = async (req, res) => res.json(await team.detail(id(req)));
export const createNutritionist = async (req, res) => res.status(201).json(await team.create(req.user, req.body));
export const updateNutritionist = async (req, res) => res.json(await team.update(req.user, id(req), req.body));

export const listAccounts = async (req, res) => res.json(await accounts.list(req.query));
export const resetPassword = async (req, res) => res.json(await accounts.resetPassword(req.user, id(req)));
export const signOutEverywhere = async (req, res) => res.json(await accounts.signOutEverywhere(req.user, id(req)));
export const parentCode = async (req, res) => res.json(await accounts.parentCode(req.user, id(req)));
export const setActive = async (req, res) => res.json(await accounts.setActive(req.user, id(req), req.body.active));

export const labUploads = async (_req, res) => res.json(await queues.labUploads());
export const labUploadAction = async (req, res) => res.json(await queues.labUploadAction(req.user, id(req), req.body));
export const accessRequests = async (_req, res) => res.json(await queues.accessRequests());
export const decideAccess = async (req, res) => res.json(await queues.decideAccess(req.user, id(req), req.body));

export const areas = async (_req, res) => res.json(await settings.areas());
export const saveArea = async (req, res) => res.json(await settings.saveArea(req.user, req.body));
export const removeArea = async (req, res) => res.json(await settings.removeArea(req.user, id(req)));

export const activity = async (req, res) => res.json(await audit.list({ page: Number(req.query.page) || 1 }));
