import mongoose from 'mongoose';

// Operations queue item shown to admins under "Needs review".
const flagSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['normal', 'watch', 'attention'], default: 'watch' },
    type: { type: String },
    title: String,
    meta: String,
    action: String,
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true },
);

export const Flag = mongoose.model('Flag', flagSchema);
