import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    lab: String,
    date: String,
    file: String,
    by: String,
    status: { type: String, enum: ['processing', 'read', 'failed'], default: 'read' },
    resultsFound: Number,
    failureReason: String,
  },
  { timestamps: true },
);

export const LabReport = mongoose.model('LabReport', labReportSchema);
