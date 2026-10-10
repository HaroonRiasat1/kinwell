import mongoose from 'mongoose';

const { Schema } = mongoose;

// Who did what to which record. Written by admin actions; read on the Activity page.
const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    action: { type: String, required: true }, // e.g. "flag.resolve", "family.assign"
    summary: String, // human sentence shown in the log
    target: { kind: String, id: Schema.Types.ObjectId, label: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
