import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { RequestHandler, Router } from "express";
import upload from "../../helpers/upload.middleware";
import * as resourcesController from "./resources.controller";

const router = Router();

function allowRoles(...roles: string[]): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(res.locals.user?.role)) {
      return res.status(403).json({ status: 403, message: "Forbidden" });
    }
    next();
  };
}

const adminOnly = allowRoles("admin");


router.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

router.get("/", asyncHandler(resourcesController.getResources));
router.get("/mine", allowRoles("contributor"), asyncHandler(resourcesController.getMyResources));
router.get("/:id/download", asyncHandler(resourcesController.downloadResource));
router.get("/adminResources", adminOnly, asyncHandler(resourcesController.getAdminResources));
router.put("/", allowRoles("contributor", "admin"), upload.single("file"), asyncHandler(resourcesController.createResources));
router.delete("/delete/:id", adminOnly, asyncHandler(resourcesController.deleteResources));
router.post("/update/:id", adminOnly, asyncHandler(resourcesController.updateResources));

export default router;
