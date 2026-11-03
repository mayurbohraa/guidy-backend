import { requestRecovery, completeRecovery, verifyRecoveryCode } from "./recovery.controller";
import asyncHandler from "../../helpers/async.handler";

import { Router } from "express";
import * as authenticationController from "./authentication.controller";

const router = Router();

router.post("/forgot-password", asyncHandler(requestRecovery));
router.post("/verify-recovery-code", asyncHandler(verifyRecoveryCode));
router.post("/reset-password", asyncHandler(completeRecovery));

router.post("/login", asyncHandler(authenticationController.login));
router.post("/signup", asyncHandler(authenticationController.signup));

export default router;
