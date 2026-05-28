import { Router } from "express";
import * as authenticationController from "./authentication.controller";

const router = Router();

router.post("/login", authenticationController.login);
router.post("/signup", authenticationController.signup);

export default router;
