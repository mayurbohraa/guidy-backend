import { Types } from "mongoose";
import gradesModel from "./grades.model";
import registrationModel from "../registration/registration.model";

export async function createGrade(userId: Types.ObjectId, grades: any) {
  return await gradesModel.create({ user: userId, ...grades });
}

export async function getGrades(userId: Types.ObjectId) {
  return await registrationModel.aggregate([
    {
      $match: {
        userId: userId,
      },
    },
    {
      $lookup: {
        from: "grades",
        localField: "userId",
        foreignField: "user",
        let: {
          courses: "$courseIds",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$course", "$$courses"],
              },
            },
          },
          {
            $lookup: {
              from: "courses",
              localField: "course",
              foreignField: "_id",
              as: "course",
            },
          },
          {
            $unwind: {
              path: "$course",
            },
          },
        ],
        as: "grades",
      },
    },
    {
      $project: {
        grades: 1,
        _id: 0,
      },
    },
  ]);
}

export async function getGradesByCourseId(
  userId: Types.ObjectId,
  courseId: Types.ObjectId
) {
  console.log({ user: userId, course: courseId });
  const data = await gradesModel
    .findOne({ user: userId, course: courseId })
    .populate({ path: "course" });
  console.log(data);
  return data;
}

export async function getProgress(
  userId: Types.ObjectId,
  year: number,
  sem: string
) {
  // const courses = await registrationModel.aggregate([
  //   {
  //     $match: {
  //       userId: userId,
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "courses",
  //       localField: "courseIds",
  //       foreignField: "_id",
  //       as: "courses",
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       courses: 1,
  //     },
  //   },
  // ]);
  // const coursesId: any[] = [];
  // if (courses.length) {
  //   courses[0].courses.forEach((course: any) => {
  //     if (course.year == year && course.term == sem) {
  //       coursesId.push(course._id);
  //     }
  //   });
  // }
  const matchObject: any = {
    user: userId,
  };
  if (year) {
    matchObject.year = year;
  }
  if (sem) {
    matchObject.term = sem;
  }
  const grades = await gradesModel.find(matchObject);
  let progress = 0;
  grades.forEach((grade: any) => {
    let totalMarks = 0;
    totalMarks +=
      totalMarks +
      grade.quiz1 +
      grade.quiz2 +
      grade.midterm +
      grade.project +
      grade.final;
    progress += totalMarks;
  });
  return progress / grades.length;
}
