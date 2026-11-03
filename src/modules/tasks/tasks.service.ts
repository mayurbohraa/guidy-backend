import { Types } from "mongoose";

import tasksModel, { Task } from "./tasks.model";

export async function createTask(createTaskDto: any): Promise<Task> {
  return await tasksModel.create(createTaskDto);
}

export async function getTasks(userId: Types.ObjectId) {
  return await tasksModel.find({ userId });
}

export async function deleteTask(
  taskId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Task | null> {
  // Scope the write itself so another account cannot mutate a guessed record ID.
  return await tasksModel.findOneAndDelete({ _id: taskId, userId: userId });
}

export async function updateTask(
  taskId: Types.ObjectId,
  userId: Types.ObjectId,
  updateTaskDto: { taskDescription?: string; checked?: boolean }
) {
  return await tasksModel.findOneAndUpdate(
    { _id: taskId, userId },
    {
      $set: {
        taskDescription: updateTaskDto.taskDescription,
        checked: updateTaskDto.checked,
      }
    },
    { runValidators: true, new: true }
  );
}

export async function deleteAllTask(userId: Types.ObjectId) {
  return await tasksModel.deleteMany({ userId: userId });
}
