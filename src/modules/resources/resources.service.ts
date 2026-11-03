import { Types } from "mongoose";

import resourcesModel from "./resources.model";

export async function createResources(createResourceDto: any) {
  return await resourcesModel.create(createResourceDto);
}

export async function getResources(status: string) {
  return await resourcesModel
    .find({
      status: status,
      isDeleted: false,
    })
    .populate("user", "firstName lastName")
    .populate("subject");
}
export async function updateResource(
  resourceId: Types.ObjectId,
  updateResourceDto: any
) {
  // A pending-only write makes repeated approval requests harmless.
  return await resourcesModel.findOneAndUpdate(
    { _id: resourceId, status: "pending", isDeleted: false },
    { $set: { status: updateResourceDto.status } },
    { new: true, runValidators: true }
  );
}
export async function deleteResources(resourceId: Types.ObjectId) {
  return await resourcesModel.findByIdAndUpdate(resourceId, {
    isDeleted: true,
  });
}
