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

}

const resourceSchema = new mongoose.Schema<Resource>({
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

export default mongoose.model<Resource>("resources", resourceSchema);
