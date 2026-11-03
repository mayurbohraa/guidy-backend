import userModel from "./user.model";
import { Request, Response } from "express";

import { Role, User } from "./user.model";
import * as authenticationService from "./authentication.service";
import httpStatus from "http-status";

// Select response fields explicitly so password hashes never enter browser storage.
function publicUser(user: User) {
  const { _id, firstName, lastName, email, mobileNumber, role } = user;
  return { _id, firstName, lastName, email, mobileNumber, role };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ status: 400, message: "Email and password are required" });
  }
  const user: User | null = await authenticationService.findUserByEmail(email);
  if (user) {
    if (await authenticationService.comparePassword(password, user.password)) {
      return res.status(httpStatus.OK).send({
        data: {
          user: publicUser(user),
          token: authenticationService.generateToken(user),
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
  if (role !== Role.Student && role !== Role.Contributor) {
    return res.status(400).json({ status: 400, message: "Select a valid signup role" });
  }
  if ([firstName, lastName, email, mobileNumber, password].some(
    (value) => typeof value !== "string" || !value.trim()
  ) || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ status: 400, message: "Invalid signup details" });
  }
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
      password: await authenticationService.hashPassword(password),
      role: role,
    });

    return res.status(httpStatus.OK).send({
      data: {
        user: publicUser(user),
        token: authenticationService.generateToken(user),
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

export async function getProfile(_req: Request, res: Response) {
  return res.json({ status: 200, data: publicUser(res.locals.user) });
}

export async function updateProfile(req: Request, res: Response) {
  const { firstName, lastName, email, mobileNumber = "" } = req.body ?? {};
  const fields: Record<string, string> = {};
  if (typeof firstName !== "string" || !firstName.trim() || firstName.trim().length > 60) {
    fields.firstName = "Enter a first name of up to 60 characters";
  }
  if (typeof lastName !== "string" || !lastName.trim() || lastName.trim().length > 60) {
    fields.lastName = "Enter a last name of up to 60 characters";
  }
  if (typeof email !== "string" || email.trim().length > 254 ||
    authenticationService.verifyMail(email.trim())) {
    fields.email = "Enter a valid Qatar University email address";
  }
  if (typeof mobileNumber !== "string" ||
    (mobileNumber.trim() && authenticationService.verifyNumber(mobileNumber.trim()))) {
    fields.mobileNumber = "Enter a valid phone number including the country code";
  }
  if (Object.keys(fields).length) {
    return res.status(400).json({ status: 400, message: "Check your profile details", fields });
  }
  const user = await authenticationService.updateUserProfile(res.locals.userId, {
    firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
    mobileNumber: mobileNumber.trim(),
  });
  if (!user) return res.status(404).json({ status: 404, message: "Account not found" });
  return res.json({ status: 200, data: publicUser(user), message: "Profile updated" });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== "string" || !currentPassword || Buffer.byteLength(currentPassword) > 72 ||
      typeof newPassword !== "string" || Buffer.byteLength(newPassword) > 72 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,20}$/.test(newPassword)) {
    return res.status(400).json({ message: "Enter your current password and a valid new password." });
  }
  const user = res.locals.user as User;
  if (!await authenticationService.comparePassword(currentPassword, user.password)) {
    return res.status(400).json({ message: "Your current password is incorrect." });
  }
  if (await authenticationService.comparePassword(newPassword, user.password)) {
    return res.status(400).json({ message: "Choose a different password." });
  }
  // Match the verified hash so concurrent password changes cannot overwrite each other.
  const updated = await userModel.updateOne({ _id: user._id, password: user.password }, {
    $set: { password: await authenticationService.hashPassword(newPassword) },
    $inc: { sessionVersion: 1 },
    $unset: { passwordResetHash: 1, passwordResetExpiresAt: 1 },
  });
  if (!updated.modifiedCount) return res.status(409).json({ message: "Your password changed. Sign in and try again." });
  return res.json({ message: "Password updated. Sign in with your new password." });
}
