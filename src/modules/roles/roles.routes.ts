import { Router } from "express";
import { Role } from "../authentication/user.model";
const router = Router();
router.get("/", (_req, res) => res.json({ data: Object.values(Role).map(role => ({ role, publicSignup: role !== Role.Admin })) }));
export default router;
