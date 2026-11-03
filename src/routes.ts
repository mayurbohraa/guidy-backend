import { searchWorkspace } from "./modules/search/search.controller";
import { listUsers } from "./modules/authentication/users.controller";
import { scheduledNotifications } from "./modules/notifications/notification.jobs";
import { listRecovery, issueRecovery, revealRecoveryCode } from "./modules/authentication/recovery.controller";
import { requireRole } from "./helpers/require.role";
import { Router } from "express";

import asyncHandler from "./helpers/async.handler";
import { changePassword, getProfile, updateProfile } from "./modules/authentication/authentication.controller";
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
router.get("/jobs/notifications", asyncHandler(scheduledNotifications));
router.use(verifyMiddleware);
router.get("/search", asyncHandler(searchWorkspace));
router.get("/users", requireRole("admin"), asyncHandler(listUsers));
router.get("/account-recovery", requireRole("admin"), asyncHandler(listRecovery));
router.post("/account-recovery/:id/approve", requireRole("admin"), asyncHandler(issueRecovery));
router.get("/profile/recovery-code", asyncHandler(revealRecoveryCode));
router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));
router.put("/profile/password", asyncHandler(changePassword));
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
