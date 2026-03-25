import mongoose from "mongoose";
import { UserModel } from "../../db/models/user.model";
import type { User } from "./types";

type UserDoc = {
  _id: mongoose.Types.ObjectId;
  email: string;
  subscription?: string;
  passwordHash: string;
  passwordSalt: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date | null;
  passwordResetToken?: string;
  passwordResetExpiry?: Date | null;
};

const toUser = (doc: UserDoc): User => ({
  id: doc._id.toString(),
  email: doc.email,
  subscription: doc.subscription ?? "Free",
  passwordHash: doc.passwordHash,
  passwordSalt: doc.passwordSalt,
  emailVerified: doc.emailVerified ?? false,
  emailVerificationToken: doc.emailVerificationToken,
  emailVerificationExpiry: doc.emailVerificationExpiry?.toISOString(),
  passwordResetToken: doc.passwordResetToken,
  passwordResetExpiry: doc.passwordResetExpiry?.toISOString(),
});

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const createUser = async (email: string, passwordHash: string, passwordSalt: string): Promise<User> => {
  const user = await UserModel.create({
    email: email.toLowerCase(),
    subscription: "Free",
    passwordHash,
    passwordSalt,
    emailVerified: false,
  });
  return toUser(user.toObject() as unknown as UserDoc);
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  const user = await UserModel.findById(id).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const deleteUserById = async (id: string): Promise<boolean> => {
  const result = await UserModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
};

export const setEmailVerificationToken = async (
  userId: string,
  token: string,
  expiry: Date
): Promise<void> => {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { emailVerificationToken: token, emailVerificationExpiry: expiry } }
  );
};

export const verifyEmail = async (token: string): Promise<User | null> => {
  const user = await UserModel.findOneAndUpdate(
    {
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    },
    {
      $set: { emailVerified: true },
      $unset: { emailVerificationToken: 1, emailVerificationExpiry: 1 },
    },
    { new: true }
  ).lean();
  return user ? toUser(user as unknown as UserDoc) : null;
};

export const setPasswordResetToken = async (
  userId: string,
  token: string,
  expiry: Date
): Promise<void> => {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { passwordResetToken: token, passwordResetExpiry: expiry } }
  );
};

export const resetPassword = async (
  token: string,
  passwordHash: string,
  passwordSalt: string
): Promise<User | null> => {
  const user = await UserModel.findOneAndUpdate(
    {
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    },
    {
      $set: { passwordHash, passwordSalt },
      $unset: { passwordResetToken: 1, passwordResetExpiry: 1 },
    },
    { new: true }
  ).lean();
  return user ? toUser(user as unknown as UserDoc) : null;
};
