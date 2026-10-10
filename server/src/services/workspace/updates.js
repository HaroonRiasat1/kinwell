import { Message } from '../../models/index.js';
import { ownClient } from './clients.js';

/** Posts the nutritionist's plain-language update into the family's message thread. */
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
