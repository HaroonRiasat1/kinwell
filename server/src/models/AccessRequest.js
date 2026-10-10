import mongoose from 'mongoose';

const { Schema } = mongoose;

// Someone asking to join a family's care team (e.g. a sibling).
const accessRequestSchema = new Schema(
  {
    family: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: { type: String, lowercase: true, trim: true },
    relation: String,
    access: { type: String, enum: ['view', 'edit'], default: 'view' },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
  },
  { timestamps: true },
);

export const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
