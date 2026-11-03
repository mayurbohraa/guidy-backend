import { Router } from "express";
import { allowedExtensions, uploadLimit } from "../../helpers/file.validation";
const router = Router();
router.get("/", (_req, res) => res.json({ data: {
  uploadMaxBytes: uploadLimit(), allowedExtensions, fileStorage: "mongodb-gridfs",
  passwordRecovery: "administrator-assisted", malwareScan: Boolean(process.env.CLAMAV_HOST),
  malwareScanRequired: process.env.REQUIRE_MALWARE_SCAN === "true",
} }));
export default router;
