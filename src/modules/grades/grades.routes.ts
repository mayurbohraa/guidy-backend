import { Router } from "express";
import * as gradesController from "./grades.controller";

const router = Router();

router.post("/", gradesController.createGrades);
router.get("/", gradesController.getGrades);
router.post("/progress", gradesController.getProgress);
router.get("/:courseId", gradesController.getGradesByCourseId);

export default router;
