import mongoose from 'mongoose';

const supplementSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    code: String,
    title: String, // "Vitamin D3 · 2,000 IU"
    simple: String, // parent-view wording: "Vitamin D tablet"
    dose: String,
    time: String,
    slot: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night'] },
    chips: [String],
    reason: String,
    link: String, // lab marker this supplement addresses
    start: String,
    review: String,
    reminderOn: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    i18n: { type: Map, of: Object }, // per-language overrides, e.g. { ur: { simple, dose, time } }
  },
  { timestamps: true },
);

export const Supplement = mongoose.model('Supplement', supplementSchema);
