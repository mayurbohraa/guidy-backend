import { Router } from "express";
import verifyMiddleware from "./helpers/verify.middleware";
import courseRoutes from "./modules/courses/courses.routes";
import authenticationRoutes from "./modules/authentication/authentication.routes";
import roleRoutes from "./modules/roles/roles.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import eventRoutes from "./modules/events/events.routes";
import registrationRoutes from "./modules/registration/registration.routes";
import taskRoutes from "./modules/tasks/task.routes";
import resourceRoutes from "./modules/resources/resources.routes";
import gradesRoute from "./modules/grades/grades.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import notebookRoutes from "./modules/notebook/notebook.routes";

const router = Router();

router.use("/", authenticationRoutes);
router.use(verifyMiddleware);
router.use("/course", courseRoutes);
router.use("/role", roleRoutes);
router.use("/settings", settingsRoutes);
router.use("/events", eventRoutes);
router.use("/registration", registrationRoutes);
router.use("/tasks", taskRoutes);
router.use("/resources", resourceRoutes);
router.use("/grades", gradesRoute);
router.use("/notifications", notificationRoutes);
router.use("/notebook", notebookRoutes);

export default router;
