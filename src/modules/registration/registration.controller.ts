import { Request, Response } from "express";
import { Registration } from "./registration.model";
import { Types } from "mongoose";
import * as registrationService from "./registration.service";
import * as courseService from "../courses/courses.services";
import httpStatus from "http-status";
import { Course } from "../courses/courses.model";

export async function getRegistration(req: Request, res: Response) {
  const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
  try {
    let registration: Registration | null =
      await registrationService.getRegistration(userId);
    res.status(httpStatus.OK).json({
      data: registration,
      message: "Registerdd course fetched successfully",
    });
  } catch (err: any) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(err.message);
  }
}

export async function createRegistration(req: Request, res: Response) {
  let courseIds: Types.ObjectId[] = req.body.courseIds.map(
    (courseId: string) => {
      return new Types.ObjectId(courseId);
    }
  );
  let userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
  try {
    const existingRegistration = await registrationService.getRegistration(
      userId
    );
    if (existingRegistration && existingRegistration.courseIds.length) {
      const courses: Course[] = [];
      for (let i = 0; i < courseIds.length; i++) {
        const course = await courseService.getCourseById(courseIds[i]);
        courses.push(course!);
      }
      if (
        courses.filter(
          (c: Course) =>
            c.year != (existingRegistration.courseIds[0] as any).year &&
            c.term != (existingRegistration.courseIds[0] as any).term
        ).length
      ) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: httpStatus.BAD_REQUEST,
          message: "Courses are not of same year and term",
        });
      }
    }
    let savedRegistration: Registration | null =
      await registrationService.makeRegistration(userId, courseIds);
    return res.status(httpStatus.OK).json(savedRegistration);
  } catch (err: any) {
    // console.log(err);
    const error: Error = err as Error;
    // console.log(error.message);
    // console.log(error.name);
    if (
      error.name == "ValidationError" &&
      error.message ==
        "Validation failed: courseIds: courseIds exceeds the limit of 10"
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: error.message,
      });
    } else {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}

export async function dropCourse(req: Request, res: Response) {
  try {
    const courseId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const registration: Registration | null =
      await registrationService.dropCourse(userId, courseId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      data: registration,
      message: "Course Droped successfully",
    });
  } catch (error: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(error.message);
  }
}

export async function endSemester(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const registration: Registration | null =
      await registrationService.endSemester(userId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      data: registration,
      message: "Semester ended successfully",
    });
  } catch (error: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(error.message);
  }
}
