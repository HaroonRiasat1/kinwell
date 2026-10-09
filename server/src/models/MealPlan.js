import mongoose from 'mongoose';

// A week of meals: days[0..6] = [breakfast, lunch, dinner, snack] dish codes.
const mealPlanSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    weekOf: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdLabel: String,
    days: [[String]],
    links: { type: Map, of: String }, // builder: slot → lab marker
    supplements: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true },
);

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
