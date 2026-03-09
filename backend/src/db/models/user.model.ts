import { Schema, model } from "mongoose";

export type UserDocument = {
  email: string;
  passwordHash: string;
  passwordSalt: string;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
