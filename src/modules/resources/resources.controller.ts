import { basename, join } from "path";

import { access, unlink } from "fs/promises";
import { uploadsDir } from "../../helpers/uploads.dir";
import resourcesModel from "./resources.model";
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import * as resourceService from "./resources.service";
import { Types } from "mongoose";
import { Resource } from "./resources.model";
import * as notificationService from "../notifications/notification.service";
import { getAdmin } from "../authentication/authentication.service";
import userModel from "../authentication/user.model";

export async function createResources(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const user: any = res.locals.user;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Choose a file to upload" });
    const { term, year, subject } = req.body;
    if (!Types.ObjectId.isValid(subject) || !["fall", "spring"].includes(term) ||
      !["1", "2", "3", "4"].includes(year)) {
      await unlink(file.path);
      return res.status(400).json({ status: 400, message: "Choose a valid year, term, and subject" });
    }
    const resources = await resourceService.createResources({
      term, year, subject,
      user: userId,
      resourceURL: file.filename,
      resourceName: file?.originalname,
    });
    // A saved submission must not appear failed if only its notification fails.
    try {
      const admin = await getAdmin();
      if (admin) await notificationService.createNotification({
        user: admin._id,
        title: `${user.firstName} ${user.lastName} has uploaded the file ${file?.originalname}`,
        description: "",
      });
    } catch {
      console.error("Resource submission notification could not be delivered");
    }
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resource uploaded successfully",
      data: resources,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResources(req: Request, res: Response, next: NextFunction) {
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
    next(error);
  }
}

export async function updateResources(req: Request, res: Response, next: NextFunction) {
  try {
    if (!["accepted", "denied"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid resource status" });
    }
    const resourceId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const resource: Resource | null = await resourceService.updateResource(
      resourceId,
      req.body
    );
    if (!resource) return res.status(404).json({ message: "Pending resource not found" });
    try {
      if (req.body.status === "accepted") {
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
    } catch {
      console.error("Resource review notifications could not be delivered");
    }
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Resources updated successfully",
      data: resource,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteResources(req: Request, res: Response, next: NextFunction) {
  try {
    const resourceId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const resource = await resourceService.deleteResources(resourceId);
    res.status(httpStatus.OK).send({
      message: "Resource deleted Sucessfully",
      status: httpStatus.OK,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminResources(req: Request, res: Response, next: NextFunction) {
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
    next(error);
  }
}

export async function downloadResource(req: Request, res: Response, next: NextFunction) {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Resource not found" });
  }
  const filter = res.locals.user.role === "admin" ? {} : { status: "accepted" };
  const resource = await resourcesModel.findOne({ _id: req.params.id, isDeleted: false, ...filter });
  if (!resource) return res.status(404).json({ message: "Resource not found" });

  // Legacy records store full filesystem paths; resolve only their filename inside uploadsDir.
  const filename = basename(resource.resourceURL.replace(/\\/g, "/"));
  let downloadRoot = uploadsDir;
  // Only the bundled fictional showcase files may fall back to read-only project storage.
  if (/^guidy-demo-resource-(?:[1-9]|1[0-4])\.txt$/.test(filename)) {
    try { await access(join(uploadsDir, filename)); }
    catch { downloadRoot = join(process.cwd(), "scripts", "demo-resources"); }
  }
  res.download(filename, basename(resource.resourceName.replace(/\\/g, "/")), {
    root: downloadRoot,
    dotfiles: "deny",
  }, (error) => {
    if (error && !res.headersSent) res.status(404).json({ message: "File unavailable" });
  });
}
