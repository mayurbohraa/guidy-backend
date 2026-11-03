import { extname } from "path";
import multer from "multer";
import { allowedExtensions, uploadLimit } from "./file.validation";

export default multer({
  fileFilter: (_req, file, callback) => {
    if (!allowedExtensions.includes(extname(file.originalname).toLowerCase())) {
      return callback(Object.assign(new Error("Choose a supported document or image"), { status: 400 }));
    }
    callback(null, true);
  },
  limits: { fileSize: uploadLimit(), files: 1, fields: 3 },
  storage: multer.memoryStorage(),
});
