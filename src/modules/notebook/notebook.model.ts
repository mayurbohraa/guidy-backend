import mongoose, { Document, model, Schema } from "mongoose";

export interface Notebook extends Document {
  user: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  notebookTitle: string;
  notebookContent: string;
  year: string;
  term: string;

}

const notebookSchema: Schema = new Schema<Notebook>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  year: {
    type: String,
  },
  term: {
    type: String,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "course",
    required: true,
  },
  notebookTitle: {
    type: String,
  },
  notebookContent: {
    type: String,
  },
});

export default model<Notebook>("notebook", notebookSchema);
