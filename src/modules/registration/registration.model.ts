import mongoose, { Schema, Types, Document } from "mongoose";

import { Course } from "../courses/courses.model";
export interface Registration extends Document {
  userId: Types.ObjectId;
  courseIds: Types.ObjectId[] | Course[];
}

const registrationSchema: Schema = new Schema<Registration>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    unique: true,
  },
  courseIds: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
      },
    ],
    validate: [arrayLimit, "Choose four to six courses"],
  },
});

function arrayLimit(val: any[]) {
  return val.length > 3 && val.length <= 6;
}


export default mongoose.model<Registration>("registration", registrationSchema);
