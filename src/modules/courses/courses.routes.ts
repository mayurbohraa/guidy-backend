import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { RequestHandler, Router } from "express";
import * as courseController from "./courses.controller";

const routes = Router();
const adminOnly: RequestHandler = (_req, res, next) => {
  if (res.locals.user?.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden" });
  }
  next();
};


routes.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

routes.get("/get-courses", asyncHandler(courseController.getCourse));
routes.get("/getSubjects/:term/:year", asyncHandler(courseController.getSubjects));
routes.post("/create-course", adminOnly, asyncHandler(courseController.createCourse));
routes.get("/:id", asyncHandler(courseController.getCourseDetails));
routes.put("/:id", adminOnly, asyncHandler(courseController.updateCourse));

export default routes;
