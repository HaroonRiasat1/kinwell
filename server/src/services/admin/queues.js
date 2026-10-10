import { AccessRequest, Family, Flag, LabReport, Message } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { record } from './audit.js';
import { resolveByKind } from './flags.js';
import { inviteLink, newInviteToken } from './families.js';

// ---------- Lab reports that couldn't be read ----------

export async function labUploads() {
  const reports = await LabReport.find({ status: { $in: ['failed', 'retake_requested', 'typed_in', 'dismissed'] } })
    .sort('-createdAt')
    .limit(100)
    .populate('parent', 'fullName short family');
  const view = (r) => ({
    id: r.id,
    file: r.file,
    lab: r.lab,
    by: r.by,
    reason: r.failureReason,
    status: r.status,
    at: r.createdAt,
    parent: r.parent?.fullName,
    parentId: r.parent?.id,
    familyId: r.parent ? String(r.parent.family) : null,
  });
  return { open: reports.filter((r) => r.status === 'failed').map(view), handled: reports.filter((r) => r.status !== 'failed').map(view) };
}

const LAB_ACTIONS = {
  retake: { status: 'retake_requested', verb: 'Asked the family for a clearer copy of' },
  typed_in: { status: 'typed_in', verb: 'Typed in the results from' },
  dismiss: { status: 'dismissed', verb: 'Dismissed' },
};

export async function labUploadAction(admin, id, { action }) {
  const r = await LabReport.findById(id).populate('parent', 'fullName short');
  if (!r) throw ApiError.notFound('Report not found');
  if (r.status !== 'failed') throw ApiError.badRequest('This report has already been handled.');
  const a = LAB_ACTIONS[action];
  r.status = a.status;
  await r.save();
  if (action === 'retake') {
    await Message.create({
      parent: r.parent.id,
      from: admin.id,
      fromKey: 'kinwell',
      fromName: 'Kinwell team',
      fromRole: 'Support',
      text: `We couldn't read "${r.file}"${r.failureReason ? ` (${r.failureReason.toLowerCase()})` : ''}. Could you upload a clearer photo or the PDF? Lay it flat in good light and make sure every number is sharp.`,
      timeLabel: 'Just now',
    });
  }
  await record(admin, `lab.${action}`, `${a.verb} ${r.file} for ${r.parent.fullName}`, { kind: 'parent', id: r.parent._id, label: r.parent.fullName });
  if (!(await LabReport.exists({ status: 'failed' }))) await resolveByKind(admin, 'labUploads', 'All unreadable reports handled');
  return labUploads();
}

// ---------- Requests to join a family's care team ----------

export async function accessRequests() {
  const list = await AccessRequest.find().sort('-createdAt').limit(100).populate('family', 'name').populate('requestedBy', 'name');
  return list.map((r) => ({
    id: r.id,
    family: r.family?.name,
    familyId: r.family?.id,
    requestedBy: r.requestedBy?.name,
    name: r.name,
    email: r.email,
    relation: r.relation,
    access: r.access,
    status: r.status,
    at: r.createdAt,
  }));
}

/** Approve adds the person as an invited member and returns their join link; decline closes it. */
export async function decideAccess(admin, id, { decision }) {
  const r = await AccessRequest.findById(id);
  if (!r) throw ApiError.notFound('Request not found');
  if (r.status !== 'pending') throw ApiError.badRequest('This request has already been decided.');
  const family = await Family.findById(r.family);
  let link = null;
  if (decision === 'approve') {
    const token = newInviteToken();
    family.members.push({ email: r.email, relation: r.relation, access: r.access, status: 'invited', inviteToken: token, invitedAt: new Date() });
    await family.save();
    link = inviteLink(token);
  }
  Object.assign(r, { status: decision === 'approve' ? 'approved' : 'declined', decidedBy: admin.id, decidedAt: new Date() });
  await r.save();
  await record(admin, `access.${decision}`, `${decision === 'approve' ? 'Approved' : 'Declined'} ${r.name} (${r.email}) joining the ${family.name}`, { kind: 'family', id: family._id, label: family.name });
  // Close the flag that pointed at this request.
  await Flag.updateMany({ resolved: false, 'link.accessRequest': r._id }, { resolved: true, resolvedBy: admin.id, resolvedAt: new Date(), resolutionNote: `Request ${r.status}` });
  return { requests: await accessRequests(), link };
}
