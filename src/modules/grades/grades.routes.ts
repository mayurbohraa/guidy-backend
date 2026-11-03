import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as gradesController from "./grades.controller";

const router = Router();


router.param("courseId", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

router.post("/", asyncHandler(gradesController.createGrades));
router.get("/", asyncHandler(gradesController.getGrades));
router.post("/progress", asyncHandler(gradesController.getProgress));
router.get("/:courseId", asyncHandler(gradesController.getGradesByCourseId));

export default router;
