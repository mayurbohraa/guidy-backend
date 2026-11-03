import mongoose, { Schema, Document } from "mongoose";

export interface Course extends Document {
  name: string;
  creditHour: number;
  percent: number;
  year: number;
  course_code: string;
  term: string;
  course_info: string;
  instructorName: string;

}

const courseSchema: Schema = new mongoose.Schema<Course>({
  name: {
    type: String,
  },
  creditHour: {
    type: Number,
  },
  percent: {
    type: Number,
  },
  year: {
    type: Number,
  },
  course_code: {
    type: String,
  },
  term: {
    type: String,

  },
  course_info: {
    type: String,
  },
  instructorName: {
    type: String,
  },
});

export default mongoose.model<Course>("course", courseSchema);
