import { Request, Response } from "express";
import users from "./user.model";

export async function listUsers(req: Request, res: Response) {
  const role = req.query.role || "student";
  if (!["student", "contributor"].includes(String(role))) return res.status(400).json({ message: "Choose Students or Contributors" });
  const page = Math.max(1, Number.parseInt(String(req.query.page)) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit)) || 15));
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0,100) : "";
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter: any = { role };
  if (search) filter.$or = ["firstName", "lastName", "email", "mobileNumber"].map(field => ({ [field]: { $regex: escaped, $options: "i" } }));
  const [data,total] = await Promise.all([
    users.find(filter).select("firstName lastName email mobileNumber role").sort({ firstName: 1, _id: 1 }).skip((page-1)*limit).limit(limit),
    users.countDocuments(filter),
  ]);
  return res.json({ data, pagination: { page, limit, total, hasNext: page * limit < total } });
}
