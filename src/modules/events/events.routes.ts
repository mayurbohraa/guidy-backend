import { Router } from "express";
import * as eventController from "./events.controller";

const router = Router();

router.post("/create-event", eventController.createEvent);
router.get("/get-events", eventController.getEvents);
router.delete("/delete-event/:id", eventController.deleteEvent);
router.delete("/delete-all-events", eventController.deleteAllEvents);
router.put("/:id", eventController.updateEventById);

export default router;
