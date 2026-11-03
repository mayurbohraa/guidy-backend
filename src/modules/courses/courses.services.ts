import { Types } from "mongoose";

import coursesModel, { Course } from "./courses.model";

export async function getCourseById(
  courseId: Types.ObjectId
): Promise<Course | null> {
  return await coursesModel.findById(courseId);
}

export async function createCourse(createCourseDto: any): Promise<Course> {
  return await coursesModel.create(createCourseDto);
}

export async function getCourses(
  search: string,
  limit: number,
  page: number
): Promise<Array<Course>> {
  return await coursesModel
    .find({
      name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
    })
    .limit(limit)
    .skip(limit * (page - 1));
}

export async function deleteCourseById(
  courseId: Types.ObjectId
): Promise<Course | null> {
  return await coursesModel.findByIdAndDelete(courseId);
}

export async function updateCourseById(
  courseId: Types.ObjectId,
  updateCourseDto: any
): Promise<Course | null> {
  return await coursesModel.findByIdAndUpdate(courseId, updateCourseDto);
}

export async function getSubjects(year: number, term: string) {
  return await coursesModel.find({ term: term, year: year }, { name: 1 });
}
