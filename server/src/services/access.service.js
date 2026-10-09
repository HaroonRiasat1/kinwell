import { Family, Parent } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

// Loads a parent and checks the signed-in user may see them:
// family members, the assigned nutritionist, admins, and the parent themself.
export async function loadParentFor(user, parentId) {
  const parent = await Parent.findById(parentId);
  if (!parent) throw ApiError.notFound('We could not find that person');

  if (user.role === 'admin') return parent;
  if (user.role === 'parent' && String(user.parent) === String(parent.id)) return parent;
  if (user.role === 'nutritionist' && String(parent.nutritionist) === String(user.id)) return parent;
  if (user.role === 'family') {
    const family = await Family.findById(parent.family);
    if (family?.hasMember(user.id)) return parent;
  }
  throw ApiError.forbidden();
}

export function assertCanEdit(user, parent) {
  if (user.role === 'parent' || user.role === 'admin') return;
  if (user.role === 'nutritionist' && String(parent.nutritionist) === String(user.id)) return;
  if (user.role === 'family') return; // access level for invited members is enforced at the family level
  throw ApiError.forbidden();
}
