import asyncHandler from "../../helpers/async.handler";

import { Router } from "express";
import * as authenticationController from "./authentication.controller";

const router = Router();

router.post("/login", asyncHandler(authenticationController.login));
router.post("/signup", asyncHandler(authenticationController.signup));

export default router;
