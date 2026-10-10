import { Family, MealPlan, Notification, Parent, Visit } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { STATUS_RANK } from '../../utils/status.js';
import { visitSummary } from '../parent.service.js';

/** Loads a parent who is this nutritionist's client, or 404s. */
export async function ownClient(nutritionist, parentId) {
  const parent = await Parent.findById(parentId);
  if (!parent || String(parent.nutritionist) !== String(nutritionist.id)) throw ApiError.notFound('Client not found');
  return parent;
}

const contactLabel = (contact) => {
  if (!contact) return '';
  const [first, last] = contact.name.split(' ');
  return `${first} ${last?.[0] ?? ''}. · ${contact.city ?? ''}`;
};

/** Clients sorted the way a nutritionist works: most urgent first, then soonest visit. */
export async function listClients(nutritionist) {
  const parents = await Parent.find({ nutritionist: nutritionist.id });
  const families = await Family.find({ _id: { $in: parents.map((p) => p.family) } }).populate('mainContact');
  const byId = Object.fromEntries(families.map((f) => [f.id, f]));
  const visits = await Promise.all(parents.map((p) => visitSummary(p)));
  return parents
    .map((p, i) => ({
      id: p.id,
      name: p.short && p.short !== p.fullName ? `${p.fullName} (${p.short})` : p.fullName,
      age: p.age,
      area: p.area,
      family: contactLabel(byId[String(p.family)]?.mainContact),
      status: p.overall,
      last: visits[i].lastVisit,
      next: visits[i].nextVisit,
      nextAt: visits[i].upcoming?.scheduledFor ?? null,
    }))
    .sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || (a.nextAt ?? Infinity) - (b.nextAt ?? Infinity));
}

/** What the client page needs beyond the family's own views: contact details and plan state. */
export async function clientSummary(nutritionist, parentId) {
  const parent = await ownClient(nutritionist, parentId);
  const [family, published, draft, visits] = await Promise.all([
    Family.findById(parent.family).populate('mainContact', 'name email phone city'),
    MealPlan.findOne({ parent: parent.id, status: 'published' }).sort('-createdAt'),
    MealPlan.findOne({ parent: parent.id, status: 'draft' }),
    visitSummary(parent),
  ]);
  const c = family?.mainContact;
  return {
    parent: { id: parent.id, fullName: parent.fullName, short: parent.short, age: parent.age, area: parent.area, overall: parent.overall, overallTitle: parent.overallTitle },
    family: { id: family?.id, name: family?.name, contact: c && { name: c.name, email: c.email, phone: c.phone, city: c.city } },
    lastVisit: visits.lastVisit,
    nextVisit: visits.nextVisit,
    nextIn: visits.nextIn,
    plan: { published: published && { weekOf: published.weekOf, createdLabel: published.createdLabel }, hasDraft: Boolean(draft) },
  };
}

export async function getVisitContext(nutritionist, parentId) {
  const parent = await ownClient(nutritionist, parentId);
  const lastVisit = await Visit.findOne({ parent: parent.id, status: 'completed' }).sort('-scheduledFor');
  return {
    parent: { id: parent.id, short: parent.short, fullName: parent.fullName, age: parent.age, area: parent.area },
    lastMeasurements: lastVisit?.meas ?? [],
  };
}

/** Notices for this nutritionist (e.g. reminders from admins), newest first. */
export async function notifications(nutritionist) {
  const list = await Notification.find({ user: nutritionist.id }).sort('-createdAt').limit(20);
  return list.map((n) => ({ id: n.id, title: n.title, body: n.body, from: n.from, read: n.read, at: n.createdAt }));
}

export async function markNotificationRead(nutritionist, id) {
  await Notification.updateOne({ _id: id, user: nutritionist.id }, { read: true });
  return notifications(nutritionist);
}
