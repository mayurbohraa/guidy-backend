import { Request, Response, NextFunction, RequestHandler } from "express";

/** Forward rejected controller promises to Express 4's error middleware. */
export default function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

}
