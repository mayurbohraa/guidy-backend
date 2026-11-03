import { randomUUID, timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import resources from "../resources/resources.model";
import users from "../authentication/user.model";
import notifications from "./notification.model";

export async function deliverResourceNotifications(limit = 3) {
  const result = { delivered: 0, failed: 0 };
  for (let index = 0; index < limit; index++) {
    const now = new Date(), lease = randomUUID();
    // The job is stored with its resource write; a lease coordinates concurrent request/cron workers.
    const resource = await resources.findOneAndUpdate({ isDeleted: false, notificationJobs: { $elemMatch: {
      deliveredAt: null, nextAttemptAt: { $lte: now }, lockedUntil: { $lte: now },
    } } }, { $set: { "notificationJobs.$.lease": lease, "notificationJobs.$.lockedUntil": new Date(Date.now() + 120000) } }, { new: true });
    if (!resource) break;
    const job = resource.notificationJobs.find(item => item.lease === lease);
    try {
      const recipients = job.kind === "submitted" ? await users.find({ role: "admin" }).select("_id")
        : job.kind === "accepted" ? await users.find({ role: "student" }).select("_id")
        : [{ _id: resource.user }];
      const title = job.kind === "submitted" ? "Resource awaiting review" : job.kind === "accepted" ? "New resource available" : "Your resource was declined";
      if (recipients.length) await notifications.bulkWrite(recipients.map(user => ({ updateOne: {
        filter: { deliveryKey: `${resource._id}:${job.kind}:${user._id}` },
        update: { $setOnInsert: { user: user._id, title, description: resource.resourceName, isRead: false } }, upsert: true,
      } })), { ordered: false });
      // Repeating an interrupted delivery never creates duplicate notifications or resets read flags.
      await resources.updateOne({ _id: resource._id, "notificationJobs.lease": lease }, { $set: {
        "notificationJobs.$.deliveredAt": new Date(), "notificationJobs.$.lockedUntil": new Date(0),
      } });
      result.delivered++;
    } catch {
      await resources.updateOne({ _id: resource._id, "notificationJobs.lease": lease }, {
        $inc: { "notificationJobs.$.attempts": 1 }, $set: {
          "notificationJobs.$.nextAttemptAt": new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6))),
          "notificationJobs.$.lockedUntil": new Date(0),
        },
      });
      result.failed++;
    }
  }
  return result;
}

export async function retryNotifications(_req: Request, res: Response) {
  res.json({ data: await deliverResourceNotifications(20) });
}

export async function scheduledNotifications(req: Request, res: Response) {
  const secret = process.env.CRON_SECRET;
  const supplied = req.headers.authorization || "";
  if (!secret || secret.length < 32) return res.status(503).json({ message: "Job authentication is not configured" });
  const expected = Buffer.from("Bearer " + secret), actual = Buffer.from(supplied);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ message: "Unauthorized" });
  return retryNotifications(req, res);
}
