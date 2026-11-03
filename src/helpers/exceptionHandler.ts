import { Request, Response, NextFunction } from "express";

import { MulterError } from "multer";
import mongoose from "mongoose";

export default (error: Error & { status?: number; code?: string | number }, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  if (error instanceof MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ status, message: error.message });
  }
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ status: 400, message: "Check the submitted values" });
  }
  if (error.code === 11000) {
    return res.status(409).json({ status: 409, message: "This record already exists" });
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ status: error.status, message: error.message });
  }
  res.status(500).json({ status: 500, message: "Internal server error" });
};
