import mongoose from "mongoose";
import { UserModel } from "../../db/models/user.model";
import type { User, UserRole } from "./types";
import { getSubscriptionLabel } from "../../utils/validation";
import type { BillingPlan, BillingStatus } from "../../db/models/user.model";

type UserDoc = {
  _id: mongoose.Types.ObjectId;
  email: string;
  plan?: BillingPlan;
  billingStatus?: BillingStatus;
  billingProvider?: "paddle";
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  paddleTransactionId?: string;
  subscriptionRenewsAt?: Date | null;
  subscriptionCanceledAt?: Date | null;
  lifetimeUnlockedAt?: Date | null;
  role?: UserRole;
  primaryCurrency?: string;
  passwordHash: string;
  passwordSalt: string;
  googleId?: string;
  tokenVersion?: number;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date | null;
  passwordResetToken?: string;
  passwordResetExpiry?: Date | null;
  subscription?: string;
};

const normalizePlan = (doc: UserDoc): BillingPlan => {
  if (doc.plan) return doc.plan;
  const subscription = doc.subscription?.toLowerCase();
  if (subscription === "pro" || subscription === "lifetime") return subscription;
  return "free";
};

const toUser = (doc: UserDoc): User => ({
  id: doc._id.toString(),
  email: doc.email,
  plan: normalizePlan(doc),
  billingStatus: doc.billingStatus ?? "inactive",
  billingProvider: doc.billingProvider,
  paddleCustomerId: doc.paddleCustomerId,
  paddleSubscriptionId: doc.paddleSubscriptionId,
  paddleTransactionId: doc.paddleTransactionId,
  subscriptionRenewsAt: doc.subscriptionRenewsAt?.toISOString(),
  subscriptionCanceledAt: doc.subscriptionCanceledAt?.toISOString(),
  lifetimeUnlockedAt: doc.lifetimeUnlockedAt?.toISOString(),
  subscription: getSubscriptionLabel(normalizePlan(doc)),
  role: doc.role ?? "user",
  primaryCurrency: doc.primaryCurrency ?? "USD",
  passwordHash: doc.passwordHash,
  passwordSalt: doc.passwordSalt,
  googleId: doc.googleId,
  tokenVersion: doc.tokenVersion ?? 0,
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
    plan: "free",
    billingStatus: "inactive",
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
      $inc: { tokenVersion: 1 },
      $unset: { passwordResetToken: 1, passwordResetExpiry: 1 },
    },
    { new: true }
  ).lean();
  return user ? toUser(user as unknown as UserDoc) : null;
};

export const invalidateTokens = async (userId: string): Promise<void> => {
  await UserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
};

export const findUserByGoogleId = async (googleId: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ googleId }).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const createGoogleUser = async (email: string, googleId: string): Promise<User> => {
  const user = await UserModel.create({
    email: email.toLowerCase(),
    plan: "free",
    billingStatus: "inactive",
    passwordHash: "",
    passwordSalt: "",
    googleId,
    emailVerified: true,
  });
  return toUser(user.toObject() as unknown as UserDoc);
};

export const linkGoogleId = async (userId: string, googleId: string): Promise<void> => {
  await UserModel.updateOne({ _id: userId }, { $set: { googleId, emailVerified: true } });
};

export const updatePrimaryCurrency = async (userId: string, currency: string): Promise<User | null> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { primaryCurrency: currency } },
    { new: true }
  ).lean();
  return user ? toUser(user as unknown as UserDoc) : null;
};
