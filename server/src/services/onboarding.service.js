import { Family, Parent, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../middleware/auth.js';
import { newInviteToken } from './admin/families.js';

export async function listNutritionists() {
  const people = await User.find({ role: 'nutritionist', 'nutritionist.availability': 'active' }).sort('name');
  return people.map((u) => ({
    id: u.id,
    name: u.name,
    credential: u.nutritionist?.credential,
    languages: u.nutritionist?.languages,
    areas: (u.nutritionist?.areas ?? []).join(', '),
    next: u.nutritionist?.nextOpening ? `Next opening: ${u.nutritionist.nextOpening}` : '',
  }));
}

const keyFor = (name) => name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '') || 'parent';

// Creates the account, family, parents and invites from the 5-step onboarding flow.
export async function completeOnboarding(input) {
  if (await User.exists({ email: input.you.email })) {
    throw ApiError.badRequest('There is already an account with that email. Try signing in instead.');
  }
  const nutritionist = input.nutritionistId ? await User.findOne({ _id: input.nutritionistId, role: 'nutritionist' }) : null;

  const user = new User({ name: input.you.name, email: input.you.email, role: 'family', city: input.you.city, timezone: input.you.timezone });
  await user.setPassword(input.you.password);

  const family = new Family({
    name: `${input.you.name.split(' ').slice(-1)[0]} family`,
    mainContact: user.id,
    nutritionist: nutritionist?.id,
    members: [
      { user: user.id, relation: input.you.relation ?? 'Main contact', access: 'edit', status: 'active' },
      ...input.invites.filter((i) => i.email).map((i) => ({ email: i.email.toLowerCase(), access: i.access, status: 'invited', inviteToken: newInviteToken(), invitedAt: new Date() })),
    ],
  });
  user.family = family.id;

  const parents = input.parents.map((p, i) => {
    const health = i === 0 ? input.health : undefined;
    return new Parent({
      family: family.id,
      nutritionist: nutritionist?.id,
      key: keyFor(p.callThem ?? p.name),
      short: p.callThem ?? p.name.split(' ')[0],
      fullName: p.name,
      age: p.age,
      city: p.city,
      area: p.area,
      overall: 'normal',
      overallTitle: 'Getting started',
      overallText: 'No visits yet. Once the first home visit happens, you will see updates here.',
      conditions: (health?.conditions ?? []).filter((c) => c !== 'None that I know of').map((name) => ({ name })),
      diet: health?.diet ?? [],
      medicines: health?.medicines ? [{ name: health.medicines }] : [],
    });
  });

  await user.save();
  await family.save();
  await Parent.insertMany(parents);
  return { token: signToken(user), user: user.toPublic() };
}
