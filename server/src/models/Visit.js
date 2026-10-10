import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    nutritionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['scheduled', 'reschedule_requested', 'in_progress', 'completed'], default: 'scheduled' },
    code: String,
    scheduledFor: Date,
    loggedAt: Date, // when the nutritionist saved the visit notes
    date: String, // "Monday 28 September 2026"
    short: String, // "28 Sep"
    time: String,
    title: String,
    summary: String,
    dur: String,
    plan: [String],
    obs: [String],
    meas: [{ _id: false, n: String, v: String, status: String }],
    tests: [String],
    recs: [String],
    next: [String],
    mood: String,
    requestedSlot: { day: String, time: String },
  },
  { timestamps: true },
);

export const Visit = mongoose.model('Visit', visitSchema);
