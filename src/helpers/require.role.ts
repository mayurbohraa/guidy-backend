import { RequestHandler } from "express";

export function requireRole(...roles: string[]): RequestHandler {
  return (_req, res, next) => roles.includes(res.locals.user?.role)
    ? next() : res.status(403).json({ status: 403, message: "Forbidden" });
}
