import { createHmac, timingSafeEqual } from "crypto";
import type { BillingPlan, BillingStatus } from "../../db/models/user.model";
import type { User } from "../auth/types";
import {
  findUserById,
  findUserByPaddleCustomerId,
  findUserByPaddleSubscriptionId,
  findUserByPaddleTransactionId,
  updateUserBilling,
} from "../auth/user.repository";
import { createTransactionCheckout, type PaddleTransactionPayload } from "./paddle.client";

type SupportedBillingEventType =
  | "transaction.completed"
  | "subscription.activated"
  | "subscription.expired";

export type PaddleWebhookEvent = {
  eventId?: string;
  eventType: SupportedBillingEventType;
  occurredAt: string;
  plan?: BillingPlan;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  transactionId?: string;
  renewsAt?: string;
  canceledAt?: string;
};

export type BillingUpdate = {
  plan: BillingPlan;
  billingStatus: BillingStatus;
  billingProvider?: "paddle";
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  paddleTransactionId?: string;
  subscriptionRenewsAt?: Date | null;
  subscriptionCanceledAt?: Date | null;
  lifetimeUnlockedAt?: Date | null;
};

type SupportedWebhookPayload = {
  event_id?: unknown;
  event_type?: unknown;
  occurred_at?: unknown;
  data?: Record<string, unknown>;
};

type ProcessBillingWebhookResult =
  | { status: "applied"; update: BillingUpdate; userId: string }
  | { status: "ignored"; reason: "invalid_payload" | "unsupported_event" | "user_not_found" };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const readPlan = (value: unknown): BillingPlan | undefined => {
  return value === "free" || value === "pro" || value === "lifetime" ? value : undefined;
};

const withPaddleMetadata = (user: User, event: PaddleWebhookEvent, update: BillingUpdate): BillingUpdate => ({
  ...update,
  billingProvider: event.customerId || event.subscriptionId || event.transactionId || user.billingProvider ? "paddle" : undefined,
  paddleCustomerId: event.customerId ?? user.paddleCustomerId,
  paddleSubscriptionId: event.subscriptionId ?? user.paddleSubscriptionId,
  paddleTransactionId: event.transactionId ?? user.paddleTransactionId,
});

export const applyBillingEvent = (user: User, event: PaddleWebhookEvent): BillingUpdate => {
  if (event.eventType === "transaction.completed" && event.plan === "lifetime") {
    return withPaddleMetadata(user, event, {
      plan: "lifetime",
      billingStatus: "active",
      lifetimeUnlockedAt: new Date(event.occurredAt),
    });
  }

  if (event.eventType === "subscription.activated") {
    return withPaddleMetadata(user, event, {
      plan: user.plan === "lifetime" ? "lifetime" : "pro",
      billingStatus: "active",
      subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
      subscriptionCanceledAt: null,
      lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
    });
  }

  if (event.eventType === "subscription.expired") {
    return withPaddleMetadata(
      user,
      event,
      user.plan === "lifetime"
        ? {
            plan: "lifetime",
            billingStatus: "active",
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
            lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
          }
        : {
            plan: "free",
            billingStatus: "inactive",
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
          }
    );
  }

  return withPaddleMetadata(user, event, {
    plan: user.plan,
    billingStatus: user.billingStatus,
    subscriptionRenewsAt: user.subscriptionRenewsAt ? new Date(user.subscriptionRenewsAt) : undefined,
    subscriptionCanceledAt: user.subscriptionCanceledAt ? new Date(user.subscriptionCanceledAt) : undefined,
    lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
  });
};

const resolveUserForEvent = async (event: PaddleWebhookEvent): Promise<User | undefined> => {
  if (event.userId) {
    const user = await findUserById(event.userId);
    if (user) return user;
  }

  if (event.subscriptionId) {
    const user = await findUserByPaddleSubscriptionId(event.subscriptionId);
    if (user) return user;
  }

  if (event.customerId) {
    const user = await findUserByPaddleCustomerId(event.customerId);
    if (user) return user;
  }

  if (event.transactionId) {
    return findUserByPaddleTransactionId(event.transactionId);
  }

  return undefined;
};

export const parsePaddleWebhookEvent = (payload: unknown): PaddleWebhookEvent | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const webhookPayload = payload as SupportedWebhookPayload;
  const eventType = readString(webhookPayload.event_type);
  const occurredAt = readString(webhookPayload.occurred_at);
  const data = isRecord(webhookPayload.data) ? webhookPayload.data : undefined;

  if (!eventType || !occurredAt || !data) {
    return null;
  }

  if (
    eventType !== "transaction.completed" &&
    eventType !== "subscription.activated" &&
    eventType !== "subscription.expired"
  ) {
    return null;
  }

  const customData = isRecord(data.custom_data) ? data.custom_data : undefined;

  return {
    eventId: readString(webhookPayload.event_id),
    eventType,
    occurredAt,
    plan: readPlan(customData?.plan),
    userId: readString(customData?.userId) ?? readString(customData?.user_id),
    customerId: readString(data.customer_id),
    subscriptionId:
      eventType === "transaction.completed"
        ? readString(data.subscription_id)
        : readString(data.id),
    transactionId:
      eventType === "transaction.completed"
        ? readString(data.id)
        : readString(data.transaction_id),
    renewsAt: readString(data.next_billed_at),
    canceledAt: readString(data.canceled_at),
  };
};

const parseSignatureHeader = (signatureHeader: string): { timestamp: string; signatures: string[] } | null => {
  const pairs = signatureHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split("="))
    .filter((entry): entry is [string, string] => entry.length === 2);

  const timestamp = pairs.find(([key]) => key === "ts")?.[1];
  const signatures = pairs.filter(([key]) => key === "h1").map(([, value]) => value);

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
};

export const verifyPaddleWebhookSignature = (
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean => {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const parsedSignature = parseSignatureHeader(signatureHeader);
  if (!parsedSignature) {
    return false;
  }

  const signedPayload = `${parsedSignature.timestamp}:${rawBody}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return parsedSignature.signatures.some((signature) => {
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  });
};

export const processBillingWebhook = async (payload: unknown): Promise<ProcessBillingWebhookResult> => {
  const event = parsePaddleWebhookEvent(payload);
  if (!event) {
    return { status: "ignored", reason: "invalid_payload" };
  }

  const user = await resolveUserForEvent(event);
  if (!user) {
    return { status: "ignored", reason: "user_not_found" };
  }

  const update = applyBillingEvent(user, event);
  const updatedUser = await updateUserBilling(user.id, update);
  if (!updatedUser) {
    return { status: "ignored", reason: "user_not_found" };
  }

  return { status: "applied", update, userId: updatedUser.id };
};

export const createBillingCheckout = async (payload: PaddleTransactionPayload) => {
  return createTransactionCheckout(payload);
};
