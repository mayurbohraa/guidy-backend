import { Request, Response } from "express";
import { User } from "./user.model";
import * as authenticationService from "./authentication.service";
import httpStatus from "http-status";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user: User | null = await authenticationService.findUserByEmail(email);
  if (user) {
    if (authenticationService.comparePassword(password, user.password)) {
      return res.status(httpStatus.OK).send({
        data: {
          user,
          token: authenticationService.generateToken(user.toObject()),
        },
        message: "User loggedin successfully",
        status: httpStatus.OK,
      });
    } else {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Password doesn't matched",
        status: httpStatus.BAD_REQUEST,
      });
    }
  } else {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "User with this email doesn't found",
      status: httpStatus.BAD_REQUEST,
    });
  }
}

export async function signup(req: Request, res: Response) {
  const { firstName, lastName, email, mobileNumber, password, role } = req.body;
  console.log(req.body);
  if (authenticationService.verifyMail(email)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: "Email is not valid",
    });
  }
  if (authenticationService.verifyNumber(mobileNumber)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: "mobile number is not valid",
    });
  }
  let user: User | null = await authenticationService.findUserByEmail(email);
  if (!user) {
    const user: User = await authenticationService.createUser({
      firstName: firstName,
      lastName: lastName,
      email: email,
      mobileNumber: mobileNumber,
      password: authenticationService.hashPassword(password),
      role: role,
    });

    return res.status(httpStatus.OK).send({
      data: {
        user,
        token: authenticationService.generateToken(user.toObject()),
      },
      message: "User created successfully",
      status: httpStatus.OK,
    });
  } else {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "User already exists",
      status: httpStatus.BAD_REQUEST,
    });
  }
}

export async function forgetPassword(req: Request, res: Response) {
  const {} = req.body;
}

export async function resetPassword(req: Request, res: Response) {
  const {} = req.body;
}
