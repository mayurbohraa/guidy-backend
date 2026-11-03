import mongoose, { Schema } from "mongoose";

export enum NotificationType {
  CourseRegisterd = "courseRegisterd",
}

const notificationSchema: Schema = new Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    notificationType: {
      type: String,
      enum: NotificationType,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("notifications", notificationSchema);
