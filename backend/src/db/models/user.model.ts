import { Schema, model } from "mongoose";
import type { UserRole } from "../../modules/auth/types";

export type UserDocument = {
  email: string;
  subscription: string;
  role: UserRole;
  primaryCurrency: string;
  passwordHash: string;
  passwordSalt: string;
  googleId?: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    subscription: { type: String, required: true, default: "Free" },
    role: { type: String, enum: ["user", "admin"], required: true, default: "user" },
    primaryCurrency: { type: String, required: true, default: "USD" },
    passwordHash: { type: String, required: true, default: "" },
    passwordSalt: { type: String, required: true, default: "" },
    googleId: { type: String, index: true, sparse: true },
    tokenVersion: { type: Number, required: true, default: 0 },
    emailVerified: { type: Boolean, required: true, default: false },
    emailVerificationToken: { type: String, index: true, sparse: true },
    emailVerificationExpiry: { type: Date },
    passwordResetToken: { type: String, index: true, sparse: true },
    passwordResetExpiry: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
