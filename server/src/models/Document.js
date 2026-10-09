import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    name: String,
    type: { type: String },
    file: String,
    by: String,
  },
  { timestamps: true },
);

export const Document = mongoose.model('Document', documentSchema);
