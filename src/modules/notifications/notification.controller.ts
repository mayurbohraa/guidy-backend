import httpStatus from "http-status";
import { Request, Response } from "express";
import { Types } from "mongoose";
import * as notificationService from "./notification.service";

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const notifications = await notificationService.getNotificationsByUserId(
      userId
    );
    res.status(httpStatus.OK).send({
      data: notifications,
      status: httpStatus.OK,
      message: "Notifications fetched successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: error,
    });
  }
}

export async function createNotification(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
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
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error,
    });
  }
}

export async function updateNotification(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const notificationId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notification = await notificationService.updateNotificationById(
      notificationId,
      req.body
    );
    res.status(httpStatus.OK).send({
      data: notification,
      message: "Notifications update successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: error,
    });
  }
}
