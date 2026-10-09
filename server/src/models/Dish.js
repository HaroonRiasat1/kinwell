import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  nut: [String],
  why: String,
  link: String,
});

export const Dish = mongoose.model('Dish', dishSchema);
