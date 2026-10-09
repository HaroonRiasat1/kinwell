import mongoose from 'mongoose';

// One message in a parent's care-team thread. A message may carry a visit summary card.
const messageSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromKey: String, // "hina" | "sana" | "bilal" — stable avatar key
    fromName: String,
    fromRole: String,
    text: String,
    timeLabel: String,
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  },
  { timestamps: true },
);

export const Message = mongoose.model('Message', messageSchema);
