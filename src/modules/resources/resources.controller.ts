import { Request, Response } from "express";
import httpStatus from "http-status";
import * as resourceService from "./resources.service";
import { Types } from "mongoose";
import { Resource } from "./resources.model";
import * as notificationService from "../notifications/notification.service";
import { getAdmin } from "../authentication/authentication.service";
import userModel from "../authentication/user.model";

export async function createResources(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const user: any = JSON.parse(res.get("user")!);
    const file = req.file;
    console.log(req.file);
    const resources = await resourceService.createResources({
      ...req.body,
      user: userId,
      resourceURL: file!.path,
      resourceName: file?.originalname,
    });
    const admin = await getAdmin();
    await notificationService.createNotification({
      user: admin?._id,
      title: `${user.firstName} ${user.lastName} has uploaded the file ${file?.originalname}`,
      description: "",
    });
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resource uploaded successfully",
      data: resources,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function getResources(req: Request, res: Response) {
  try {
    const resources: Array<Resource> = await resourceService.getResources(
      "accepted"
    );
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resources fetched successfully",
      data: resources,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function updateResources(req: Request, res: Response) {
  try {
    const resourceId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const resource: Resource | null = await resourceService.updateResource(
      resourceId,
      req.body
    );
    if (req.body.status == "accepted") {
      const users: any[] = await userModel.find({ role: "student" });
      const notifications: any[] = [];

      users.forEach((element) => {
        const notificationDto = {
          user: element._id,
          title: "New Resource Availabe",
          description: `${resource?.resourceName} has been added`,
        };
        notifications.push(notificationDto);
      });
      await notificationService.createMultipleNotifications(notifications);
    } else if (req.body.status == "denied") {
      await notificationService.createNotification({
        user: resource?.user,
        title: "Your uploaded Document has been declined",
        description:
          "The Document you have uploaded may be inapropriate, for more info contact admin",
      });
    }
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resources updated successfully",
      data: resource,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function deleteResources(req: Request, res: Response) {
  try {
    const resourceId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const resource = await resourceService.deleteResources(resourceId);
    res.status(httpStatus.OK).send({
      message: "Resource deleted Sucessfully",
      status: httpStatus.OK,
      data: resource,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function getAdminResources(req: Request, res: Response) {
  try {
    const resources: Array<Resource> = await resourceService.getResources(
      "pending"
    );
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resources fetched successfully",
      data: resources,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}
