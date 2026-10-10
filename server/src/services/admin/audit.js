import { AuditLog } from '../../models/index.js';

/** Records an admin action. Never throws: a failed log write must not undo the action. */
export async function record(actor, action, summary, target) {
  try {
    await AuditLog.create({ actor: actor?.id, actorName: actor?.name, action, summary, target });
  } catch (err) {
    console.error('[audit] write failed', err.message);
  }
}

export async function list({ page = 1, limit = 30, targetIds } = {}) {
  const filter = targetIds ? { 'target.id': { $in: targetIds } } : {};
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return {
    items: items.map((a) => ({ id: a.id, at: a.createdAt, actor: a.actorName, action: a.action, summary: a.summary, target: a.target })),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}
