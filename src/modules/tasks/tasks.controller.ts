import httpStatus from "http-status";

import { Request, Response, NextFunction } from "express";
import * as taskService from "./tasks.service";
import { Task } from "./tasks.model";
import { Types } from "mongoose";

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskDescription } = req.body;
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
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
    next(error);
  }
}

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const tasks: Array<Task> = await taskService.getTasks(userId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const task: Task | null = await taskService.deleteTask(taskId, res.locals.userId);
    if (!task) return res.status(404).json({ status: 404, message: "Record not found" });
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Task deleted successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const task = await taskService.updateTask(taskId, res.locals.userId, req.body);
    if (!task) return res.status(404).json({ status: 404, message: "Record not found" });
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Tasks updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const tasks = await taskService.deleteAllTask(userId);
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "All task delete successfully",
    });
  } catch (error) {
    next(error);
  }
}
