import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import { Course } from "./courses.model";
import * as courseServices from "./courses.services";

export async function createCourse(req: Request, res: Response) {
  const {
    courseName,
    creditHour,
    year,
    percent,
    course_code,
    term,
    course_info,
    instructorName,
  } = req.body;
  const createCourseDto = {
    name: courseName,
    creditHour: creditHour,
    percent: percent,
    year: year,
    course_code: course_code,
    term: term,
    course_info: course_info,
    instructorName: instructorName,
  };

  const course: Course = await courseServices.createCourse(createCourseDto);
  res.status(httpStatus.OK).send({
    data: course,
    message: "Course Created successfully",
    status: httpStatus.OK,
  });
}

export async function getCourse(req: Request, res: Response) {
  const { search, limit, page } = req.query;
  const courses: Array<Course> = await courseServices.getCourses(
    search as string,
    parseInt(limit as string),
    parseInt(page as string)
  );
  res.status(httpStatus.OK).send({
    data: courses,
    message: "Courses fetched succesfully",
    status: httpStatus.OK,
  });
}

export async function updateCourse(req: Request, res: Response) {
  const courseId: Types.ObjectId = new Types.ObjectId(req.params.id);
  const updateCourseDto = {
    name: req.body.courseName,
  };
  const course: Course | null = await courseServices.updateCourseById(
    courseId,
    updateCourseDto
  );
  res.status(httpStatus.OK).send({
    data: course,
    message: "Course updated successfully",
    status: httpStatus.OK,
  });
}

export async function deleteCourse(req: Request, res: Response) {
  const courseId: Types.ObjectId = new Types.ObjectId(req.params.id);
  const course: Course | null = await courseServices.deleteCourseById(courseId);
  res.status(httpStatus.OK).send({
    data: course,
    message: "Course deleted successfully",
    status: httpStatus.OK,
  });
}

export async function getSubjects(req: Request, res: Response) {
  try {
    const term = req.params.term;
    const year = parseInt(req.params.year as string);
    const subjects: Array<Course> = await courseServices.getSubjects(
      year,
      term
    );
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  } catch (error) {
    console.log(error);
    const err: Error = error as Error;
    res.status(httpStatus.OK).send({
      data: error,
      message: err.message,
    });
  }
}
