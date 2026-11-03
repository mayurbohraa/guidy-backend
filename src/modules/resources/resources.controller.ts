import { basename, join } from "path";
import { access } from "fs/promises";
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { uploadsDir } from "../../helpers/uploads.dir";
import { inspectFile, scanFile } from "../../helpers/file.validation";
import { storeFile, removeFile, resourceBucket } from "../../helpers/file.storage";
import resourcesModel from "./resources.model";
import courseModel from "../courses/courses.model";
import * as resourceService from "./resources.service";
import { deliverResourceNotifications } from "../notifications/notification.jobs";

export async function createResources(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "Choose a file to upload" });
  const { term, year, subject } = req.body;
  if (!Types.ObjectId.isValid(subject) || !["fall", "spring"].includes(term) || !["1", "2", "3", "4"].includes(year)) {
    return res.status(400).json({ message: "Choose a valid year, term, and subject" });
  }
  if (!await courseModel.exists({ _id: subject, year: Number(year), term })) return res.status(400).json({ message: "The subject does not match the selected year and term" });
  const filename = basename(file.originalname.replace(/\\/g, "/"));
  const mimeType = inspectFile(file.buffer, filename);
  const scanStatus = await scanFile(file.buffer);
  const fileId = await storeFile(file.buffer, filename, mimeType);
  let resource;
  try {
    resource = await resourceService.createResources({ term, year, subject, user: res.locals.userId,
      resourceURL: String(fileId), resourceName: filename, fileId, mimeType, scanStatus,
      fileSize: file.size, notificationJobs: [{ kind: "submitted" }],
    });
  } catch (error) { await removeFile(fileId).catch(() => undefined); throw error; }
  // Delivery failures leave a durable pending job, without misreporting a saved submission as failed.
  await deliverResourceNotifications().catch(() => console.error("Resource notifications remain queued"));
  return res.json({ status: 200, message: "Resource submitted for review", data: resource });
}

export async function getResources(_req: Request, res: Response) {
  return res.json({ status: 200, data: await resourceService.getResources("accepted") });
}

export async function updateResources(req: Request, res: Response) {
  if (!["accepted", "denied"].includes(req.body.status)) return res.status(400).json({ message: "Invalid resource status" });
  const resource = await resourceService.updateResource(new Types.ObjectId(req.params.id), req.body);
  if (!resource) return res.status(404).json({ message: "Pending resource not found" });
  await deliverResourceNotifications().catch(() => console.error("Resource notifications remain queued"));
  return res.json({ status: 200, message: "Resource updated", data: resource });
}

export async function deleteResources(req: Request, res: Response) {
  const resource = await resourceService.deleteResources(new Types.ObjectId(req.params.id));
  if (!resource) return res.status(404).json({ message: "Resource not found" });
  return res.json({ status: 200, message: "Resource deleted", data: resource });
}

export async function getAdminResources(_req: Request, res: Response) {
  return res.json({ status: 200, data: await resourceService.getResources("pending") });
}

export async function downloadResource(req: Request, res: Response, _next?: NextFunction) {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: "Resource not found" });
  const filter = res.locals.user.role === "admin" ? {} : { status: "accepted" };
  const resource = await resourcesModel.findOne({ _id: req.params.id, isDeleted: false, ...filter });
  if (!resource) return res.status(404).json({ message: "Resource not found" });
  if (resource.fileId) {
    const bucket = resourceBucket();
    if (!await bucket.find({ _id: resource.fileId }).hasNext()) return res.status(404).json({ message: "File unavailable" });
    res.attachment(basename(resource.resourceName.replace(/\\/g, "/")));
    res.type("application/octet-stream"); res.setHeader("X-Content-Type-Options", "nosniff");
    const stream = bucket.openDownloadStream(resource.fileId);
    stream.on("error", () => { if (!res.headersSent) res.status(404).json({ message: "File unavailable" }); else res.destroy(); });
    res.on("close", () => stream.destroy());
    stream.pipe(res);
    return;
  }
  // Older records remain readable while a copy-only migration moves available files into GridFS.
  const filename = basename(resource.resourceURL.replace(/\\/g, "/"));
  let downloadRoot = uploadsDir;
  if (/^guidy-demo-resource-(?:[1-9]|1[0-4])\.txt$/.test(filename)) {
    try { await access(join(uploadsDir, filename)); }
    catch { downloadRoot = join(process.cwd(), "scripts", "demo-resources"); }
  }
  res.download(filename, basename(resource.resourceName.replace(/\\/g, "/")), { root: downloadRoot, dotfiles: "deny" }, error => {
    if (error && !res.headersSent) res.status(404).json({ message: "File unavailable" });
  });
}

export async function getMyResources(_req: Request, res: Response) {
  const data = await resourcesModel.find({ user: res.locals.userId, isDeleted: false })
    .select("resourceName subject year term status")
    .populate("subject", "name")
    .sort({ _id: -1 })
    .lean();
  return res.json({ data });
}
