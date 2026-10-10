// The nutritionist's inbox: one conversation per client, newest first, with
// conversations waiting for a reply at the top.
import { Family, Message, Parent } from '../../models/index.js';

export async function inbox(nutritionist) {
  const parents = await Parent.find({ nutritionist: nutritionist.id }, 'fullName short family');
  const ids = parents.map((p) => p._id);
  const last = await Message.aggregate([
    // Only written messages count; a visit summary card isn't a reply to a question.
    { $match: { parent: { $in: ids }, text: { $nin: [null, ''] } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$parent', msg: { $first: '$$ROOT' } } },
  ]);
  const families = await Family.find({ _id: { $in: parents.map((p) => p.family) } }, 'name');
  const famName = Object.fromEntries(families.map((f) => [f.id, f.name]));
  const byParent = Object.fromEntries(parents.map((p) => [p.id, p]));
  const threads = last
    .map(({ _id, msg }) => {
      const p = byParent[String(_id)];
      const fromFamily = msg.from && String(msg.from) !== nutritionist.id && msg.fromRole !== 'Nutritionist' && msg.fromRole !== 'Support';
      return {
        parentId: String(_id),
        name: p.fullName,
        family: famName[String(p.family)] ?? '',
        last: msg.text ?? 'Visit summary',
        from: msg.fromName,
        at: msg.createdAt,
        time: msg.timeLabel?.split(' · ')[0] ?? '',
        needsReply: Boolean(fromFamily),
      };
    })
    .sort((a, b) => Number(b.needsReply) - Number(a.needsReply) || new Date(b.at) - new Date(a.at));
  return { threads, needsReply: threads.filter((t) => t.needsReply).length };
}
