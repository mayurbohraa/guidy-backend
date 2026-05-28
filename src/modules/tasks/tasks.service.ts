import { Types } from "mongoose";
import tasksModel, { Task } from "./tasks.model";

export async function createTask(createTaskDto: any): Promise<Task> {
  return await tasksModel.create(createTaskDto);
}

export async function getTasks(userId: Types.ObjectId) {
  return await tasksModel.find({ userId });
}

export async function deleteTask(taskId: Types.ObjectId): Promise<Task | null> {
  return await tasksModel.findByIdAndDelete(taskId);
}

export async function updateTask(taskId: Types.ObjectId, updateTaskDto: any) {
  return await tasksModel.findByIdAndUpdate(taskId, updateTaskDto);
}

export async function deleteAllTask(userId: Types.ObjectId) {
  return await tasksModel.deleteMany({ userId: userId });
}
