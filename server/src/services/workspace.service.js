import { LIB_SUPPS as SUPPLEMENT_CATALOG, MARKER_NAMES } from '@kinwell/shared';
import { Dish, Family, MealPlan, Message, Parent, Visit } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function listClients(nutritionist) {
  const parents = await Parent.find({ nutritionist: nutritionist.id }).sort('createdAt');
  const families = await Family.find({ _id: { $in: parents.map((p) => p.family) } }).populate('mainContact');
  const byId = Object.fromEntries(families.map((f) => [f.id, f]));
  return parents.map((p) => {
    const contact = byId[String(p.family)]?.mainContact;
    const [first, last] = (contact?.name ?? '').split(' ');
    return {
      id: p.id,
      name: p.short && p.short !== p.fullName ? `${p.fullName} (${p.short})` : p.fullName,
      age: p.age,
      area: p.area,
      family: contact ? `${first} ${last?.[0] ?? ''}. · ${contact.city}` : '',
      status: p.overall,
      last: p.lastVisit,
      next: p.nextVisit,
    };
  });
}

async function ownClient(nutritionist, parentId) {
  const parent = await Parent.findById(parentId);
  if (!parent || String(parent.nutritionist) !== String(nutritionist.id)) throw ApiError.notFound('Client not found');
  return parent;
}

export async function getVisitContext(nutritionist, parentId) {
  const parent = await ownClient(nutritionist, parentId);
  const lastVisit = await Visit.findOne({ parent: parent.id, status: 'completed' }).sort('-scheduledFor');
  return {
    parent: { id: parent.id, short: parent.short, fullName: parent.fullName, age: parent.age, area: parent.area },
    lastMeasurements: lastVisit?.meas ?? [],
  };
}

// Saves a completed home visit from the tablet form.
export async function logVisit(nutritionist, parentId, input) {
  const parent = await ownClient(nutritionist, parentId);
  const now = new Date();
  const visit = await Visit.create({
    parent: parent.id,
    nutritionist: nutritionist.id,
    status: 'completed',
    scheduledFor: now,
    date: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now),
    short: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(now),
    title: input.title ?? 'Home visit',
    summary: input.notes?.slice(0, 140) ?? '',
    obs: input.observations,
    meas: input.vitals.filter((v) => v.value).map((v) => ({ n: v.label, v: `${v.value} ${v.unit}`.trim(), status: 'normal' })),
    tests: input.tests,
    mood: input.mood,
  });
  parent.lastVisit = visit.short;
  await parent.save();
  return { id: visit.id };
}

export async function getBuilderLibrary() {
  const dishes = await Dish.find().sort('name');
  return {
    meals: dishes.map((d) => ({ code: d.code, name: d.name, nut: d.nut, link: d.link })),
    supplements: SUPPLEMENT_CATALOG,
    markers: MARKER_NAMES,
  };
}

// Saves a single day's plan from the drag-and-drop builder as a draft for next week.
export async function savePlanDay(nutritionist, parentId, { meals, supplements, links }) {
  const parent = await ownClient(nutritionist, parentId);
  const plan =
    (await MealPlan.findOne({ parent: parent.id, status: 'draft' })) ??
    new MealPlan({ parent: parent.id, status: 'draft', weekOf: '12 October', days: Array.from({ length: 7 }, () => []) });
  plan.createdBy = nutritionist.id;
  plan.days.set(0, ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((slot) => meals[slot] ?? null));
  plan.links = links;
  plan.supplements = supplements;
  await plan.save();
  return { id: plan.id, saved: true };
}

// Posts the nutritionist's plain-language update into the family's message thread.
export async function sendFamilyUpdate(nutritionist, parentId, { text }) {
  const parent = await ownClient(nutritionist, parentId);
  const msg = await Message.create({
    parent: parent.id,
    from: nutritionist.id,
    fromKey: nutritionist.name.split(' ')[0].toLowerCase(),
    fromName: nutritionist.name,
    fromRole: 'Nutritionist',
    text,
    timeLabel: 'Just now',
  });
  return { id: msg.id, sent: true };
}
