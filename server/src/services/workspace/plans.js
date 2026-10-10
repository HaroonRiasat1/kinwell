// Weekly meal plans: the nutritionist edits a draft for next week and publishes it to the family.
import { LIB_SUPPS as SUPPLEMENT_CATALOG, MARKER_NAMES } from '@kinwell/shared';
import { Dish, MealPlan, Message, Supplement } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { startOfWeek } from '../../utils/time.js';
import { ownClient } from './clients.js';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DAY = 24 * 3600 * 1000;
const fmt = (d, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', ...o }).format(d).replace('Sept', 'Sep');
const emptyWeek = () => Array.from({ length: 7 }, () => [null, null, null, null]);

/** "12–18 October" for next Monday–Sunday (or "26 Oct – 1 Nov" across months). */
export function nextWeekLabel(now = new Date()) {
  const mon = new Date(startOfWeek(now).getTime() + 7 * DAY + 12 * 3600 * 1000);
  const sun = new Date(mon.getTime() + 6 * DAY);
  const [m1, m2] = [fmt(mon, { month: 'long' }), fmt(sun, { month: 'long' })];
  return m1 === m2 ? `${fmt(mon, { day: 'numeric' })}–${fmt(sun, { day: 'numeric' })} ${m1}` : `${fmt(mon, { day: 'numeric', month: 'short' })} – ${fmt(sun, { day: 'numeric', month: 'short' })}`;
}

export async function getBuilderLibrary() {
  const dishes = await Dish.find().sort('name');
  return {
    meals: dishes.map((d) => ({ code: d.code, name: d.name, nut: d.nut, link: d.link })),
    supplements: SUPPLEMENT_CATALOG,
    markers: MARKER_NAMES,
  };
}

const catalogueIdFor = (title) => SUPPLEMENT_CATALOG.find((c) => c.n === title)?.id;
const normaliseDays = (days) => emptyWeek().map((blank, d) => blank.map((_, s) => days?.[d]?.[s] ?? null));

/** The plan to edit: an existing draft, or a copy of what the family has now. */
export async function getPlan(nutritionist, parentId) {
  const parent = await ownClient(nutritionist, parentId);
  const [draft, published, supps] = await Promise.all([
    MealPlan.findOne({ parent: parent.id, status: 'draft' }),
    MealPlan.findOne({ parent: parent.id, status: 'published' }).sort('-createdAt'),
    Supplement.find({ parent: parent.id, active: true }),
  ]);
  const source = draft ?? published;
  return {
    weekOf: draft?.weekOf ?? nextWeekLabel(),
    isDraft: Boolean(draft),
    published: published && { weekOf: published.weekOf, createdLabel: published.createdLabel },
    days: normaliseDays(source?.days),
    links: Object.fromEntries(source?.links ?? []),
    supplements: draft?.supplements?.length ? draft.supplements : supps.map((s) => catalogueIdFor(s.title)).filter(Boolean),
  };
}

export async function savePlan(nutritionist, parentId, { days, links, supplements }) {
  const parent = await ownClient(nutritionist, parentId);
  const plan = (await MealPlan.findOne({ parent: parent.id, status: 'draft' })) ?? new MealPlan({ parent: parent.id, status: 'draft', weekOf: nextWeekLabel() });
  plan.set({ createdBy: nutritionist.id, days: normaliseDays(days), links, supplements });
  await plan.save();
  return getPlan(nutritionist, parentId);
}

/**
 * Makes the draft the family's plan: checks every day has breakfast, lunch and dinner,
 * syncs supplements from the catalogue, and tells the family.
 */
export async function publishPlan(nutritionist, parentId) {
  const parent = await ownClient(nutritionist, parentId);
  const draft = await MealPlan.findOne({ parent: parent.id, status: 'draft' });
  if (!draft) throw ApiError.badRequest('Save the plan first.');
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const gaps = draft.days.flatMap((meals, d) => SLOTS.slice(0, 3).filter((_, s) => !meals[s]).map((slot) => `${names[d]} ${slot.toLowerCase()}`));
  if (gaps.length) throw ApiError.badRequest(`Fill in every breakfast, lunch and dinner first. Missing: ${gaps.slice(0, 4).join(', ')}${gaps.length > 4 ? ` and ${gaps.length - 4} more` : ''}.`);

  await MealPlan.updateMany({ parent: parent.id, status: 'published' }, { status: 'archived' });
  draft.set({ status: 'published', publishedAt: new Date(), createdLabel: `Made by ${nutritionist.name.split(' ')[0]} on ${fmt(new Date(), { day: 'numeric', month: 'short' })}` });
  await draft.save();

  // Supplements from the catalogue follow the plan: add new ones, stop ones taken out.
  const wanted = new Set(draft.supplements ?? []);
  const current = await Supplement.find({ parent: parent.id });
  for (const s of current) {
    const id = catalogueIdFor(s.title);
    if (id && s.active && !wanted.has(id)) {
      s.active = false;
      await s.save();
    }
  }
  let next = current.length + 1;
  for (const id of wanted) {
    const item = SUPPLEMENT_CATALOG.find((c) => c.id === id);
    const existing = current.find((s) => s.title === item?.n);
    if (!item) continue;
    if (existing) {
      if (!existing.active) await existing.updateOne({ active: true });
      continue;
    }
    await Supplement.create({
      parent: parent.id,
      code: `s${next++}`,
      title: item.n,
      simple: `${item.n.split(' · ')[0]} tablet`,
      dose: '1 tablet',
      time: 'Morning',
      slot: 'Morning',
      chips: ['Morning'],
      reason: draft.links?.get(`s-${id}`) ?? item.link,
      link: draft.links?.get(`s-${id}`) ?? item.link,
      start: fmt(new Date(), { day: 'numeric', month: 'short', year: 'numeric' }),
      review: 'Next visit',
    });
  }

  await Message.create({
    parent: parent.id,
    from: nutritionist.id,
    fromKey: nutritionist.name.split(' ')[0].toLowerCase(),
    fromName: nutritionist.name,
    fromRole: 'Nutritionist',
    text: `I've made ${parent.short}'s meal plan for ${draft.weekOf}. You'll find it under Nutrition plan, and ${parent.short}'s daily list follows it from tomorrow.`,
    timeLabel: 'Just now',
  });
  return getPlan(nutritionist, parentId);
}
