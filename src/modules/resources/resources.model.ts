import mongoose, { Types, Document } from "mongoose";

export interface Resource extends Document {
  term: string;
  year: string;
  subject: Types.ObjectId;
  resourceURL: string;
  status: string;
  resourceName: string;
  isDeleted: boolean;
  user: Types.ObjectId;
  fileId?: Types.ObjectId;
  mimeType?: string;
  fileSize?: number;
  scanStatus?: string;
  notificationJobs: any[];

}

const resourceSchema = new mongoose.Schema<Resource>({
  fileId: mongoose.Schema.Types.ObjectId,
  mimeType: String,
  fileSize: Number,
  scanStatus: { type: String, enum: ["clean", "format-checked"] },
  notificationJobs: [{
    kind: { type: String, enum: ["submitted", "accepted", "denied"] },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lockedUntil: { type: Date, default: () => new Date(0) },
    lease: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
  }],
  term: {
    type: String,
    trim: true,
  },
  year: {
    type: String,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "course",
  },
  resourceURL: {
    type: String,
  },
  resourceName: {
    type: String,
  },
  status: {
    type: String,
    enum: ["accepted", "denied", "pending"],
    default: "pending",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

resourceSchema.index({ "notificationJobs.nextAttemptAt": 1 });

export default mongoose.model<Resource>("resources", resourceSchema);
