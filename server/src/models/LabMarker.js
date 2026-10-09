import mongoose from 'mongoose';

// One tracked lab marker or vital (e.g. "Vitamin D") with its six-month history.
const labMarkerSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    order: Number,
    name: { type: String, required: true },
    value: String,
    unit: String,
    status: { type: String, enum: ['normal', 'watch', 'attention'], default: 'normal' },
    series: [Number],
    months: [String],
    trend: String,
    range: String, // human label, e.g. "30–100"
    band: [Number], // numeric healthy band for charts, [lo, hi]
    plain: String,
    meaning: { means: String, doing: String, you: String },
  },
  { timestamps: true },
);

export const LabMarker = mongoose.model('LabMarker', labMarkerSchema);
