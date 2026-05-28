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

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
}

export function generateToken(user: User): string {
  return jsonwebtoken.sign(user, process.env.secret_key!);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function createUser(createUserDto: any): Promise<User> {
  return userModel.create(createUserDto);
}

export function verifyMail(email: string): boolean {
  const validDomains = ["qu.edu.qa"];
  const emailDomain = email.split("@").pop() ?? "";
  return emailDomain in validDomains;
}
export function verifyNumber(mobileNumber: string): any {
  let numberInfo = phone(mobileNumber);
  return !numberInfo.isValid;
}

export async function getAdmin() {
  return await userModel.findOne({ role: "admin" });
}
