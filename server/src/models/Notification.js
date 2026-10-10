import mongoose from 'mongoose';

// In-app notice for a staff member (e.g. an admin reminder to a nutritionist).
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: String,
    from: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Notification = mongoose.model('Notification', notificationSchema);
