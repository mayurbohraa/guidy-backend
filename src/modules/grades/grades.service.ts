import { createHash } from "crypto";
import { Types } from "mongoose";

import gradesModel from "./grades.model";
import registrationModel from "../registration/registration.model";

export async function createGrade(userId: Types.ObjectId, grades: any) {
  const existing = await gradesModel.findOne({ user: userId, course: grades.course }).select("_id");
  // Deterministic IDs prevent concurrent first saves from creating duplicate course records.
  const id = existing?._id ?? new Types.ObjectId(createHash("sha256").update(String(userId) + ":" + String(grades.course)).digest("hex").slice(0, 24));
  const { course, year, term, quiz1, quiz2, midterm, project, final } = grades;
  const update = { course, year, term, quiz1, quiz2, midterm, project, final, user: userId };
  try { return await gradesModel.findOneAndUpdate({ _id: id, user: userId }, { $set: update }, { upsert: true, new: true, runValidators: true }); }
  catch (error) {
    if ((error as any).code !== 11000) throw error;
    return gradesModel.findOneAndUpdate({ _id: id, user: userId }, { $set: update }, { new: true, runValidators: true });
  }
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
  const data = await gradesModel
    .findOne({ user: userId, course: courseId })
    .populate({ path: "course" });
  return data;
}

export async function getProgress(
  userId: Types.ObjectId,
  year: number,
  sem: string
) {
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
  // Each assessment is out of 20, so five scores form the course percentage.
  if (!grades.length) return 0;
  const total = grades.reduce((sum, grade) => {
    return sum + (grade.quiz1 ?? 0) + (grade.quiz2 ?? 0) +
      (grade.midterm ?? 0) + (grade.project ?? 0) + (grade.final ?? 0);
  }, 0);
  return total / grades.length;
}
