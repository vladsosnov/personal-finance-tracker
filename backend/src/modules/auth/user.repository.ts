import mongoose from "mongoose";
import { UserModel } from "../../db/models/user.model";
import type { User, UserRole } from "./types";
import { getEffectivePlan, getSubscriptionLabel } from "../../utils/validation";
import type { BillingPlan, BillingStatus } from "../../db/models/user.model";

type UserDoc = {
  _id: mongoose.Types.ObjectId;
  email: string;
  plan?: BillingPlan;
  billingStatus?: BillingStatus;
  billingProvider?: "stripe";
  processedBillingWebhookEventIds?: string[];
  latestBillingEventAt?: Date | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
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

export type UserBillingUpdate = {
  plan: BillingPlan;
  billingStatus: BillingStatus;
  billingProvider?: "stripe";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  latestBillingEventAt?: Date | null;
  subscriptionRenewsAt?: Date | null;
  subscriptionCanceledAt?: Date | null;
  lifetimeUnlockedAt?: Date | null;
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
  stripeCustomerId: doc.stripeCustomerId,
  stripeSubscriptionId: doc.stripeSubscriptionId,
  stripeCheckoutSessionId: doc.stripeCheckoutSessionId,
  latestBillingEventAt: doc.latestBillingEventAt?.toISOString(),
  subscriptionRenewsAt: doc.subscriptionRenewsAt?.toISOString(),
  subscriptionCanceledAt: doc.subscriptionCanceledAt?.toISOString(),
  lifetimeUnlockedAt: doc.lifetimeUnlockedAt?.toISOString(),
  subscription: getSubscriptionLabel(getEffectivePlan({ role: doc.role ?? "user", plan: normalizePlan(doc) })),
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

const toBillingSet = (billing: UserBillingUpdate): Record<string, unknown> => {
  const update: Record<string, unknown> = {
    plan: billing.plan,
    billingStatus: billing.billingStatus,
    subscription: getSubscriptionLabel(billing.plan),
  };

  if (billing.billingProvider !== undefined) update.billingProvider = billing.billingProvider;
  if (billing.stripeCustomerId !== undefined) update.stripeCustomerId = billing.stripeCustomerId;
  if (billing.stripeSubscriptionId !== undefined) update.stripeSubscriptionId = billing.stripeSubscriptionId;
  if (billing.stripeCheckoutSessionId !== undefined) update.stripeCheckoutSessionId = billing.stripeCheckoutSessionId;
  if (billing.latestBillingEventAt !== undefined) update.latestBillingEventAt = billing.latestBillingEventAt;
  if (billing.subscriptionRenewsAt !== undefined) update.subscriptionRenewsAt = billing.subscriptionRenewsAt;
  if (billing.subscriptionCanceledAt !== undefined) update.subscriptionCanceledAt = billing.subscriptionCanceledAt;
  if (billing.lifetimeUnlockedAt !== undefined) update.lifetimeUnlockedAt = billing.lifetimeUnlockedAt;

  return update;
};

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

export const findUserByStripeCustomerId = async (stripeCustomerId: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ stripeCustomerId }).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const findUserByStripeSubscriptionId = async (stripeSubscriptionId: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ stripeSubscriptionId }).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const findUserByStripeCheckoutSessionId = async (stripeCheckoutSessionId: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ stripeCheckoutSessionId }).lean();
  return user ? toUser(user as unknown as UserDoc) : undefined;
};

export const updateUserBilling = async (userId: string, billing: UserBillingUpdate): Promise<User | null> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: toBillingSet(billing) },
    { new: true }
  ).lean();

  return user ? toUser(user as unknown as UserDoc) : null;
};

export const hasProcessedBillingWebhookEvent = async (userId: string, eventId: string): Promise<boolean> => {
  const existing = await UserModel.exists({
    _id: userId,
    processedBillingWebhookEventIds: eventId,
  });

  return existing !== null;
};

export const updateUserBillingForWebhookEvent = async (
  userId: string,
  eventId: string,
  occurredAt: Date,
  billing: UserBillingUpdate
): Promise<User | null> => {
  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      processedBillingWebhookEventIds: { $ne: eventId },
      $or: [
        { latestBillingEventAt: { $exists: false } },
        { latestBillingEventAt: null },
        { latestBillingEventAt: { $lte: occurredAt } },
      ],
    },
    {
      $set: {
        ...toBillingSet(billing),
        latestBillingEventAt: occurredAt,
      },
      $addToSet: { processedBillingWebhookEventIds: eventId },
    },
    { new: true }
  ).lean();

  return user ? toUser(user as unknown as UserDoc) : null;
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
