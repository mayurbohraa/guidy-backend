import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import * as gradesService from "./grades.service";

export async function createGrades(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const grades = await gradesService.createGrade(userId, req.body);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grade created sucesfully",
      data: grades,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function getGrades(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const grades: any = (await gradesService.getGrades(userId)).pop();
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grade fetched ssuccessfully",
      data: grades.grades,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function getGradesByCourseId(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const courseId: Types.ObjectId = new Types.ObjectId(req.params.courseId);
    const grades = await gradesService.getGradesByCourseId(userId, courseId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Grades fetched successfully",
      data: grades,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}

export async function getProgress(req: Request, res: Response) {
  try {
    const { year, sem } = req.body;
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
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
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data: error,
    });
  }
}
