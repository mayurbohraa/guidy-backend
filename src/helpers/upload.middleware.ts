import { extname } from "path";

import multer from "multer";
import { uploadsDir } from "./uploads.dir";

const upload = multer({
  fileFilter: (_req, file, callback) => {
    const allowedExtensions = [".pdf", ".txt", ".png", ".jpg", ".jpeg",
      ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"];
    if (!allowedExtensions.includes(extname(file.originalname).toLowerCase())) {
      callback(Object.assign(new Error("Choose a supported document or image"), { status: 400 }));
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      const ext = file.originalname.split(".").pop();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "." + ext);
    },
  }),
});

export default upload;
