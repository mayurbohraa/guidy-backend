import registrationModel, { Registration } from "./registration.model";
import { Types } from "mongoose";

export async function makeRegistration(
  userId: Types.ObjectId,
  courseIds: Array<Types.ObjectId>
): Promise<Registration | null> {
  const registration: Registration | null = await registrationModel.findOne({
    userId: userId,
  });
  if (registration) {
    const newCourseIds = [...courseIds, ...registration.courseIds];
    return await registrationModel.findByIdAndUpdate(
      registration._id,
      { courseIds: newCourseIds },
      { runValidators: true }
    );
  }
  return await registrationModel.create({ userId, courseIds });
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
    }
  );
}

export async function endSemester(userId: Types.ObjectId) {
  return await registrationModel.findOneAndUpdate(
    { userId: userId },
    { courseIds: [] }
  );
}
