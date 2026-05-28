import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import passport from "passport";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: any = await new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        (
          err: any,
          user?: Express.User | false | null,
          info?: object | string | Array<string | undefined>,
          status?: number | Array<number | undefined>
        ) => {
          if (err) {
            reject(err);
          }
          if (user) {
            resolve(user);
          }
          if (info) {
            reject(info);
          }
          if (status) {
            reject(status);
          }
        }
      )(req, res, next);
    });
    res.set("userId", user._id);
    res.set("user", JSON.stringify(user));
    next();
  } catch (error) {
    console.log(error);
    res.status(httpStatus.UNAUTHORIZED).send({
      status: httpStatus.UNAUTHORIZED,
      message: "unauthorised",
    });
  }
};
