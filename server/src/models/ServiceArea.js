import mongoose from 'mongoose';

// Area of Lahore served by Kinwell, with how many clients the team can take there.
const serviceAreaSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  activeClients: { type: Number, default: 0 },
  capacity: { type: Number, required: true },
});

export const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
