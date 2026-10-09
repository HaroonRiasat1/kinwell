import mongoose from 'mongoose';

const { Schema } = mongoose;
const status = { type: String, enum: ['normal', 'watch', 'attention'], default: 'normal' };

const parentSchema = new Schema(
  {
    family: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    nutritionist: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    key: { type: String, required: true }, // short handle used in URLs, e.g. "ammi"
    short: { type: String, required: true }, // what the family calls them: "Ammi"
    fullName: { type: String, required: true },
    age: Number,
    born: String,
    languages: String,
    lives: String,
    city: String,
    area: String,
    phone: String,

    // Plain-language summary written by the nutritionist after each visit.
    overall: status,
    overallTitle: String,
    overallText: String,
    note: String,
    changes: [{ _id: false, k: String, v: String }],
    lastVisit: String,
    nextVisit: String,
    nextIn: String,
    nextVisitLong: String,

    alerts: [
      { status, type: { type: String }, title: String, text: String, action: String, resolved: { type: Boolean, default: false } },
    ],

    conditions: [{ _id: false, name: String, since: String, plain: String }],
    allergies: [{ _id: false, name: String, reaction: String }],
    medicines: [{ _id: false, name: String, dose: String, when: String, for: String, by: String }],
    diet: [String],
    favor: [{ _id: false, n: String, why: String }],
    limit: [{ _id: false, n: String, why: String }],
    interactions: [{ _id: false, level: status, title: String, text: String, by: String }],
  },
  { timestamps: true },
);

parentSchema.index({ family: 1, key: 1 }, { unique: true });

export const Parent = mongoose.model('Parent', parentSchema);
