import httpStatus from "http-status";
import { Request, Response } from "express";
import * as taskService from "./tasks.service";
import { Task } from "./tasks.model";
import { Types } from "mongoose";

export async function createTask(req: Request, res: Response) {
  try {
    const { taskDescription } = req.body;
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const createTaskDto = {
      userId: userId,
      taskDescription,
    };
    const task: Task = await taskService.createTask(createTaskDto);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({});
  }
}

export async function getTasks(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const tasks: Array<Task> = await taskService.getTasks(userId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({});
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const taskId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const task: Task | null = await taskService.deleteTask(taskId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Task deleted successfully",
      data: task,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({});
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const taskId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const task = await taskService.updateTask(taskId, req.body);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Tasks updated successfully",
      data: task,
    });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({});
  }
}

export async function deleteAllTask(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const tasks = await taskService.deleteAllTask(userId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "All task delete successfully",
    });
  } catch (error) {
    console.log(error);
    const err: Error = error as Error;
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: err.message,
      data: err,
    });
  }
}
