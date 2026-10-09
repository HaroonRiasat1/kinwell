import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String, // pending invites have an email but no user yet
    relation: String,
    access: { type: String, enum: ['view', 'edit'], default: 'view' },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema(
  { name: String, ini: String, rel: String, where: String, phone: String },
  { _id: false },
);

const familySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Rahman family"
    mainContact: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contacts: [contactSchema],
    status: { type: String, enum: ['normal', 'watch', 'attention'], default: 'normal' },
    lastActivityAt: Date,
  },
  { timestamps: true },
);

familySchema.methods.hasMember = function hasMember(userId) {
  const id = String(userId);
  return String(this.mainContact) === id || this.members.some((m) => m.user && String(m.user) === id);
};

export const Family = mongoose.model('Family', familySchema);
