import mongoose from 'mongoose';

// Today's checklist that the parent ticks off: supplements and meals.
const dailyLogSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD in Lahore time
    items: [
      {
        _id: false,
        code: String,
        dish: String, // dish code for meals, used to look up translations
        kind: { type: String, enum: ['supp', 'meal'] },
        title: String,
        simple: String,
        dose: String,
        time: String,
        done: { type: Boolean, default: false },
        doneAt: Date,
      },
    ],
  },
  { timestamps: true },
);

dailyLogSchema.index({ parent: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
