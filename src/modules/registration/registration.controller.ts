import { Request, Response, NextFunction } from "express";

import { Types } from "mongoose";
import * as registrationService from "./registration.service";

export async function getRegistration(req: Request, res: Response) {
  const registration = await registrationService.getRegistration(res.locals.userId);
  res.json({ data: registration, message: "Registered courses fetched successfully" });
}

export async function createRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = req.body.courseIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 6 || ids.some(
      (id) => typeof id !== "string" || !Types.ObjectId.isValid(id)
    )) {
      return res.status(400).json({ status: 400, message: "Choose between four and six valid courses" });
    }
    const registration = await registrationService.makeRegistration(
      res.locals.userId, ids.map((id) => new Types.ObjectId(id))
    );
    res.json(registration);
  } catch (error) {
    next(error);
  }
}

export async function dropCourse(req: Request, res: Response) {
  const registration = await registrationService.dropCourse(
    res.locals.userId, new Types.ObjectId(req.params.id)
  );
  res.json({ status: 200, data: registration, message: "Course dropped successfully" });
}

export async function endSemester(req: Request, res: Response) {
  const registration = await registrationService.endSemester(res.locals.userId);
  res.json({ status: 200, data: registration, message: "Semester ended successfully" });
}
