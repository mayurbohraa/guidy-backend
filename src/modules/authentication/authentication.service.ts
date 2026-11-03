import { Types } from "mongoose";

import userModel, { User } from "./user.model";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { phone } from "phone";

export async function getUserById(id: Types.ObjectId): Promise<User | null> {
  return userModel.findById(id);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return userModel.findOne({
    email: email,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function generateToken(user: User): string {
  return jsonwebtoken.sign({ _id: user._id, sessionVersion: user.sessionVersion ?? 0 }, process.env.secret_key!, { expiresIn: "8h" });
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(createUserDto: any): Promise<User> {
  return userModel.create(createUserDto);
}

export function verifyMail(email: string): boolean {
  return !/^[^\s@]+@qu\.edu\.qa$/i.test(email);
}
export function verifyNumber(mobileNumber: string): any {
  let numberInfo = phone(mobileNumber);
  return !numberInfo.isValid;
}

export async function getAdmin() {
  return await userModel.findOne({ role: "admin" });
}

export async function updateUserProfile(
  userId: Types.ObjectId,
  profile: Pick<User, "firstName" | "lastName" | "email" | "mobileNumber">
): Promise<User | null> {
  // Copy contact fields explicitly so this endpoint cannot change credentials or permissions.
  return userModel.findByIdAndUpdate(userId, { $set: {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    mobileNumber: profile.mobileNumber,
  } }, { new: true, runValidators: true });
}
