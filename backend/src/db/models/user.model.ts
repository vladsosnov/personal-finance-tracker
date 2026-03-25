import { Schema, model } from "mongoose";

export type UserDocument = {
  email: string;
  subscription: string;
  passwordHash: string;
  passwordSalt: string;
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
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    emailVerified: { type: Boolean, required: true, default: false },
    emailVerificationToken: { type: String, index: true, sparse: true },
    emailVerificationExpiry: { type: Date },
    passwordResetToken: { type: String, index: true, sparse: true },
    passwordResetExpiry: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
