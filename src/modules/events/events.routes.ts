import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as eventController from "./events.controller";

const router = Router();


router.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

router.post("/create-event", asyncHandler(eventController.createEvent));
router.get("/get-events", asyncHandler(eventController.getEvents));
router.delete("/delete-event/:id", asyncHandler(eventController.deleteEvent));
router.delete("/delete-all-events", asyncHandler(eventController.deleteAllEvents));
router.put("/:id", asyncHandler(eventController.updateEventById));

export default router;
