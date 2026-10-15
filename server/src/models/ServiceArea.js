import mongoose from 'mongoose';

// An area of a city served by Kinwell (e.g. Lahore · Model Town) and how many clients the team can
// take there. Active client counts are worked out from parents' city and area, never stored.
const serviceAreaSchema = new mongoose.Schema({
  city: { type: String, required: true, trim: true, default: 'Lahore' },
  name: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 0 },
});
// The same area name can exist in two cities ("DHA" in Lahore and in Karachi).
serviceAreaSchema.index({ city: 1, name: 1 }, { unique: true });

export const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
