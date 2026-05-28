import mongoose, { model } from "mongoose";

const gradesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "course",
  },
  year: {
    type: Number,
  },
  term: {
    type: String,
  },
  quiz1: {
    type: Number,
  },
  quiz2: {
    type: Number,
  },
  midterm: {
    type: Number,
  },
  project: {
    type: Number,
  },
  final: {
    type: Number,
  },
});

export default model("grade", gradesSchema);
