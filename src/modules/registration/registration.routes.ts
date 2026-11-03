import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as registrationController from "./registration.controller";
const router = Router();

router.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

router.get("/get-registered", asyncHandler(registrationController.getRegistration));
router.post("/register", asyncHandler(registrationController.createRegistration));
router.delete("/drop-course/:id", asyncHandler(registrationController.dropCourse));
router.delete("/end-semester", asyncHandler(registrationController.endSemester));

export default router;
