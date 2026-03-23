import { Schema, model } from "mongoose";

export type UserDocument = {
  email: string;
  subscription: string;
  passwordHash: string;
  passwordSalt: string;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    subscription: { type: String, required: true, default: "Free" },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
