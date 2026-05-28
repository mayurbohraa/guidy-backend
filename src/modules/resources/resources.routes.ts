import { Router } from "express";
import upload from "../../helpers/upload.middleware";
import * as resourcesController from "./resources.controller";

const router = Router();

router.get("/", resourcesController.getResources);
router.get("/adminResources", resourcesController.getAdminResources);
router.put("/", upload.single("file"), resourcesController.createResources);
router.delete("/delete/:id", resourcesController.deleteResources);
router.post("/update/:id", resourcesController.updateResources);

export default router;
