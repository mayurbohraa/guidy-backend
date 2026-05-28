import mongoose, { Schema, Document } from "mongoose";

export enum Role {
  Student = "student",
  Contributor = "contributor",
  Admin = "admin",
}

export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: Number;
  password: string;
  role: string;
}

const userSchema: Schema = new mongoose.Schema<User>({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  mobileNumber: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: Role,
    default: Role.Student,
  },
});

export default mongoose.model<User>("user", userSchema);
