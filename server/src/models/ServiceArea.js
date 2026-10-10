import mongoose from 'mongoose';

// Area of Lahore served by Kinwell and how many clients the team can take there.
// Active client counts are worked out from parents' areas, never stored.
const serviceAreaSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, trim: true },
  capacity: { type: Number, required: true, min: 0 },
});

export const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
