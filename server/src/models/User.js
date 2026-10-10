import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { normalizePhone } from '../utils/phone.js';

const nutritionistProfileSchema = new mongoose.Schema(
  {
    credential: String, // "Registered dietitian · 9 years"
    languages: String,
    areas: [String],
    nextOpening: String,
    onTimeRate: String,
    availability: { type: String, enum: ['active', 'on_leave'], default: 'active' },
    licenceRenewsOn: Date,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, set: (v) => (v ? normalizePhone(v) : v) },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['family', 'nutritionist', 'admin', 'parent'], required: true },
    city: String,
    timezone: String,
    language: { type: String, default: 'en' }, // UI language, e.g. 'ur'
    family: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }, // set for role=parent
    nutritionist: nutritionistProfileSchema,
    // Parent sign-in uses a one-time 6-digit SMS code instead of a password.
    loginCode: { hash: { type: String, select: false }, expiresAt: Date, attempts: { type: Number, default: 0 } },
    tokenVersion: { type: Number, default: 0 }, // bump to sign out everywhere
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};
userSchema.methods.checkPassword = function checkPassword(plain) {
  return this.passwordHash ? bcrypt.compare(plain, this.passwordHash) : false;
};
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    city: this.city,
    language: this.language,
    family: this.family,
    parent: this.parent,
    nutritionist: this.nutritionist,
  };
};

export const User = mongoose.model('User', userSchema);
