import { Router } from "express";
import * as courseController from "./courses.controller";

const routes = Router();

routes.get("/get-courses", courseController.getCourse);
routes.get("/getSubjects/:term/:year", courseController.getSubjects);
routes.post("/create-course", courseController.createCourse);
routes.put("/:id", courseController.updateCourse);

export default routes;
