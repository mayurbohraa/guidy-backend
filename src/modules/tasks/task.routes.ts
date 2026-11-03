import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as taskController from "./tasks.controller";

const routes: Router = Router();


routes.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

routes.post("/create-task", asyncHandler(taskController.createTask));
routes.get("/get-task", asyncHandler(taskController.getTasks));
routes.put("/update-task/:id", asyncHandler(taskController.updateTask));
routes.delete("/delete-task/:id", asyncHandler(taskController.deleteTask));
routes.delete("/delete-all-task", asyncHandler(taskController.deleteAllTask));

export default routes;
