import { Router } from "express";
import * as registrationController from "./registration.controller";
const router = Router();
router.get("/get-registered", registrationController.getRegistration);
router.post("/register", registrationController.createRegistration);
router.delete("/drop-course/:id", registrationController.dropCourse);
router.delete("/end-semester", registrationController.endSemester);

export default router;
