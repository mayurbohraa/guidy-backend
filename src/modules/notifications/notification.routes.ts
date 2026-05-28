import { Router } from "express";
import * as notificationController from "./notification.controller";

const router = Router();

router.get("/", notificationController.getNotifications);
router.post("/", notificationController.createNotification);
router.put("/:id", notificationController.updateNotification);

export default router;
