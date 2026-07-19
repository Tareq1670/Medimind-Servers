import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../types/auth.js";

export interface IUser extends Document {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, enum: ["user", "doctor", "admin"], default: "user" },
    avatar: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUser>("User", userSchema);
