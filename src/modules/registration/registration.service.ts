import coursesModel from "../courses/courses.model";

import registrationModel, { Registration } from "./registration.model";
import { Types } from "mongoose";

export async function makeRegistration(
  userId: Types.ObjectId,
  courseIds: Array<Types.ObjectId>
): Promise<Registration | null> {
  const registration = await registrationModel.findOne({ userId });
  const previousIds = (registration?.courseIds ?? []).map((id) => String(id));
  const selectedIds = [...new Set([...previousIds, ...courseIds.map(String)])];
  const courses = await coursesModel.find({ _id: { $in: selectedIds } });
  const first = courses[0];
  if (courses.length !== selectedIds.length || courses.length < 4 ||
    courses.length > 6 || courses.some(
      (course) => course.year !== first.year || course.term !== first.term
    )) {
    throw Object.assign(new Error("Choose four to six courses from the same year and term"), { status: 400 });
  }
  if (!registration) return registrationModel.create({ userId, courseIds: selectedIds });

  // Compare the original selection in the write to avoid overwriting a concurrent edit.
  const updated = await registrationModel.findOneAndUpdate(
    { _id: registration._id, courseIds: registration.courseIds },
    { $set: { courseIds: selectedIds } },
    { runValidators: true, new: true }
  );
  if (!updated) {
    throw Object.assign(new Error("Your registration changed. Refresh and try again"), { status: 409 });
  }
  return updated;
}

export async function getRegistration(
  userId: Types.ObjectId
): Promise<Registration | null> {
  return await registrationModel
    .findOne({ userId: userId })
    .populate("courseIds");
}

export async function dropCourse(
  userId: Types.ObjectId,
  courseId: Types.ObjectId
) {
  return await registrationModel.findOneAndUpdate(
    {
      userId: userId,
    },
    {
      $pull: { courseIds: courseId },
    },
    { new: true }
  );
}

export async function endSemester(userId: Types.ObjectId) {
  return await registrationModel.findOneAndUpdate(
    { userId: userId },
    { courseIds: [] },
    { new: true }
  );
}
