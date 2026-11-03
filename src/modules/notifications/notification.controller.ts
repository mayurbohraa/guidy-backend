import httpStatus from "http-status";

import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as notificationService from "./notification.service";

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const notifications = await notificationService.getNotificationsByUserId(
      userId
    );
    res.status(httpStatus.OK).send({
      data: notifications,
      status: httpStatus.OK,
      message: "Notifications fetched successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const { title, description } = req.body;
    const notification = await notificationService.createNotification({
      user: userId,
      title,
      description,
    });
    res.status(httpStatus.OK).send({
      message: "Notification created successfully",
      status: httpStatus.OK,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const notificationId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notification = await notificationService.updateNotificationById(
      notificationId,
      userId,
      req.body
    );
    if (!notification) return res.status(404).json({ status: 404, message: "Notification not found" });
    res.status(httpStatus.OK).send({
      data: notification,
      message: "Notifications update successfully",
    });
  } catch (error) {
    next(error);
  }
}
