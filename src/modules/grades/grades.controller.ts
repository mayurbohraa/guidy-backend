import { Request, Response, NextFunction } from "express";

import httpStatus from "http-status";
import { Types } from "mongoose";
import * as gradesService from "./grades.service";

export async function createGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const { course, year, term, quiz1, quiz2, midterm, project, final } = req.body;
    const scores = [quiz1, quiz2, midterm, project, final];
    if (!Types.ObjectId.isValid(course) || scores.some(
      (score) => typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 20
    )) {
      return res.status(400).json({ status: 400, message: "Enter valid course grades between 0 and 20" });
    }
    const grades = await gradesService.createGrade(userId, {
      course, year, term, quiz1, quiz2, midterm, project, final,
    });
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grade created sucesfully",
      data: grades,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const grades: any = (await gradesService.getGrades(userId)).pop();
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grade fetched ssuccessfully",
      data: grades?.grades ?? [],
    });
  } catch (error) {
    next(error);
  }
}

export async function getGradesByCourseId(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const courseId: Types.ObjectId = new Types.ObjectId(req.params.courseId);
    const grades = await gradesService.getGradesByCourseId(userId, courseId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grades fetched successfully",
      data: grades,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, sem } = req.body;
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const progress = await gradesService.getProgress(
      userId,
      parseInt(year as string),
      sem
    );
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      data: progress,
      message: "Progress fetched successfully",
    });
  } catch (error) {
    next(error);
  }
}
