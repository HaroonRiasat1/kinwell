import mongoose from 'mongoose';

const { Schema } = mongoose;

// Operations queue item shown to admins under "Needs review".
// `link` says what the flag is about, so its action can open the right record.
const flagSchema = new Schema(
  {
    status: { type: String, enum: ['normal', 'watch', 'attention'], default: 'watch' },
    type: { type: String },
    title: String,
    meta: String,
    action: String,
    link: {
      kind: { type: String, enum: ['parent', 'visit', 'nutritionist', 'labUploads', 'accessRequest'] },
      parent: { type: Schema.Types.ObjectId, ref: 'Parent' },
      family: { type: Schema.Types.ObjectId, ref: 'Family' },
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      visit: { type: Schema.Types.ObjectId, ref: 'Visit' },
      accessRequest: { type: Schema.Types.ObjectId, ref: 'AccessRequest' },
    },
    notes: [{ _id: false, text: String, by: { type: Schema.Types.ObjectId, ref: 'User' }, byName: String, at: Date }],
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNote: String,
  },
  { timestamps: true },
);

export const Flag = mongoose.model('Flag', flagSchema);
