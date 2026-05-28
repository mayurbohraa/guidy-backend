import mongoose, { Schema, Types, Document } from "mongoose";
import { Course } from "../courses/courses.model";
export interface Registration extends Document {
  userId: Types.ObjectId;
  courseIds: Types.ObjectId[] | Course[];
}

const registrationSchema: Schema = new Schema<Registration>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    unique: true,
  },
  courseIds: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
      },
    ],
    validate: [arrayLimit, "{PATH} exceeds the limit of 10"],
  },
});

function arrayLimit(val: any[]) {
  console.log(val);
  return val.length > 3 && val.length <= 6;
}

// registrationSchema.pre('findOneAndUpdate', function(next) {
//   this.options.runValidators = true;
//   next();
// });

export default mongoose.model<Registration>("registration", registrationSchema);
