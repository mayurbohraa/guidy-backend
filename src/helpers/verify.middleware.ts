import { Request, Response, NextFunction } from "express";

import passport from "passport";
import { User } from "../modules/authentication/user.model";

export default (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("jwt", { session: false }, (error: unknown, user: User | false) => {
    if (error) return next(error);
    if (!user) return res.status(401).json({ status: 401, message: "Unauthorized" });
    res.locals.user = user;
    res.locals.userId = user._id;
    next();
  })(req, res, next);
};
