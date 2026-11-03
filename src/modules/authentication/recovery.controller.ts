import { Request, Response } from "express";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { Types } from "mongoose";
import userModel, { User } from "./user.model";
import notifications from "../notifications/notification.model";
import recoveryModel, { recoveryLimit } from "./recovery.model";
import { hashPassword, verifyMail } from "./authentication.service";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,20}$/;

async function rateLimit(req: Request, email: string) {
  const window = Math.floor(Date.now() / (15 * 60 * 1000));
  // Persistent counters apply equally to known and unknown addresses across serverless instances.
  for (const [key, max] of [["ip:" + req.ip, 30], ["email:" + email, 5]] as const) {
    const count = await recoveryLimit.findOneAndUpdate({ key: digest(key) + ":" + window }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 15 * 60 * 1000) },
    }, { new: true, upsert: true });
    if (count!.count! > max) throw Object.assign(new Error("Please wait before requesting another reset"), { status: 429 });
  }
}

export async function requestRecovery(req: Request, res: Response) {
  const email = typeof req.body?.email === "string" ? req.body?.email.trim() : "";
  if (!email || email.length > 254 || verifyMail(email)) return res.status(400).json({ message: "Enter a valid university email" });
  await rateLimit(req, email.toLowerCase());
  const user = await userModel.findOne({ email: { $regex: "^" + email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" } });
  if (user) {
    const existing = await recoveryModel.findOne({ user: user._id });
    if (!existing) await recoveryModel.updateOne({ user: user._id }, { $setOnInsert: { requestedAt: new Date(), status: "pending" } }, { upsert: true });
    else if (existing.status === "completed" || existing.status === "issued") await recoveryModel.updateOne({ _id: existing._id, status: existing.status }, { $set: { status: "pending", requestedAt: new Date() }, $unset: { issuedAt: 1, expiresAt: 1 } });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(202).json({ message: "If the account exists, your request is available to an administrator. Any approval and simulated email delivery will be recorded in Guidy." });
}

export async function listRecovery(_req: Request, res: Response) {
  const requests = await recoveryModel.find({ status: { $ne: "completed" } })
    .sort({ requestedAt: -1 }).limit(50).populate("user", "firstName lastName email");
  return res.json({ data: requests });
}

// Derive a code without storing its plaintext. A new password hash invalidates it.
function recoveryCode(user: User, length = 16) {
  return createHmac("sha256", process.env.secret_key!)
    .update(JSON.stringify(["guidy-recovery-v1", String(user._id), user.password]))
    .digest("hex").slice(0, length).toUpperCase().match(/.{4}/g)!.join("-");
}

export async function revealRecoveryCode(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  return res.json({ data: { code: recoveryCode(res.locals.user as User) } });
}

export async function verifyRecoveryCode(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const user = await validatedRecoveryUser(req, req.body?.email, req.body?.code);
  if (!user) return res.status(400).json({ message: "The email or recovery code is incorrect." });
  return res.json({ message: "Recovery code verified." });
}

export async function issueRecovery(req: Request, res: Response) {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid request" });
  if (req.body?.identityVerified !== true) return res.status(400).json({ message: "Verify the account owner before approving." });
  const request = await recoveryModel.findOne({ _id: req.params.id, status: "pending" });
  if (!request) return res.status(404).json({ message: "Pending recovery request not found" });
  const deliveryKey = "recovery:" + request._id + ":" + request.requestedAt!.getTime();
  await notifications.updateOne({ deliveryKey }, { $setOnInsert: {
    deliveryKey, user: request.user, title: "Recovery request approved",
    description: "Recovery email delivery was simulated. No email or code was sent. Use your saved recovery code to reset your password.",
  } }, { upsert: true });
  await recoveryModel.updateOne({ _id: request._id, status: "pending", requestedAt: request.requestedAt },
    { $set: { status: "issued", issuedAt: new Date() }, $unset: { expiresAt: 1 } });
  return res.json({ message: "Request approved. Email delivery simulated and an in-app notification recorded." });
}

async function validatedRecoveryUser(req: Request, email: unknown, code: unknown) {
  const address = typeof email === "string" ? email.trim() : "";
  const normalizedCode = typeof code === "string" ? code.trim().replace(/-/g, "").toUpperCase() : "";
  if (!address || address.length > 254 || verifyMail(address) || !/^(?:[0-9A-F]{16}|[0-9A-F]{32})$/.test(normalizedCode)) return null;
  await rateLimit(req, "reset:" + address.toLowerCase());
  const user = await userModel.findOne({ email: address });
  const expected = user ? recoveryCode(user, normalizedCode.length).replace(/-/g, "") : "0".repeat(normalizedCode.length);
  return timingSafeEqual(Buffer.from(normalizedCode), Buffer.from(expected)) ? user : null;
}

export async function completeRecovery(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const { email, code, password } = req.body ?? {};
  if (typeof password !== "string" || Buffer.byteLength(password) > 72 || !passwordPattern.test(password)) {
    return res.status(400).json({ message: "Use 8–20 characters with uppercase, lowercase, a number, and one of ! @ # $ %." });
  }
  const user = await validatedRecoveryUser(req, email, code);
  const invalid = () => res.status(400).json({ message: "The email or recovery code is incorrect." });
  if (!user) return invalid();
  const updated = await userModel.updateOne({ _id: user._id, password: user.password }, {
    $set: { password: await hashPassword(password) },
    $unset: { passwordResetHash: 1, passwordResetExpiresAt: 1 },
    $inc: { sessionVersion: 1 },
  });
  if (!updated.modifiedCount) return invalid();
  // The reset has already committed. A queue update failure must not report it as failed.
  await recoveryModel.updateOne({ user: user._id }, { $set: { status: "completed" } })
    .catch(() => console.error("Recovery request status could not be updated"));
  return res.json({ message: "Password updated. Sign in with your new password." });
}
