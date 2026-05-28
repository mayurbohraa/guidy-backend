import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";

export default (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
    data: err,
    message: "Internal server error",
  });
};
