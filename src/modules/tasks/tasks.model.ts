import mongoose, { model, Schema, Types } from "mongoose";

export interface Task {
  taskDescription: string;
  checked: boolean;
  userId: Types.ObjectId;

}

const taskSchema: Schema = new Schema<Task>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  taskDescription: {
    type: String,
    trim: true,
    required: true,
    maxlength: 60,
  },
  checked: {
    type: Boolean,
    default: false,
  },
});

export default model<Task>("tasks", taskSchema);
