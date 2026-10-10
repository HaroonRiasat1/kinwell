import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  nut: [String],
  why: String,
  link: String,
  i18n: { type: Map, of: Object }, // e.g. { ur: { name } }
});

export const Dish = mongoose.model('Dish', dishSchema);
