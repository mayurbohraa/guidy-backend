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
    .populate("user")
    .populate("subject");
}
export async function updateResource(
  resourceId: Types.ObjectId,
  updateResourceDto: any
) {
  return await resourcesModel.findByIdAndUpdate(resourceId, updateResourceDto);
}
export async function deleteResources(resourceId: Types.ObjectId) {
  return await resourcesModel.findByIdAndUpdate(resourceId, {
    isDeleted: true,
  });
}
