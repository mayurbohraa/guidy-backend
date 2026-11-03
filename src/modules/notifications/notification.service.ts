import { Types } from "mongoose";

import notificationModel from "./notification.model";

export async function getNotificationsByUserId(userId: Types.ObjectId) {
  return await notificationModel.find({ user: userId }).sort({ createdAt: -1 });
}

export async function createNotification(createNotificationDto: any) {
  return await notificationModel.create(createNotificationDto);
}

export async function updateNotificationById(
  notificationId: Types.ObjectId,
  userId: Types.ObjectId,
  updateNotificationDto: { isRead: boolean }
) {
  return await notificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: updateNotificationDto.isRead } },
    { new: true, runValidators: true }
  );
}

export async function createMultipleNotifications(notifications: any[]) {
  return await notificationModel.insertMany(notifications);
}
