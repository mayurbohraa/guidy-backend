import mongoose, { model, Schema, Types } from "mongoose";

export interface Task {
  taskDescription: string;
  userId: Types.ObjectId;
}

const taskSchema: Schema = new Schema<Task>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  taskDescription: {
    type: String,
  },
});

export default model<Task>("tasks", taskSchema);
