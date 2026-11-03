import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as notificationController from "./notification.controller";

const router = Router();


router.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

router.get("/", asyncHandler(notificationController.getNotifications));
router.post("/", asyncHandler(notificationController.createNotification));
router.put("/:id", asyncHandler(notificationController.updateNotification));

export default router;
