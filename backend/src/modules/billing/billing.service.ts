import { createHmac, timingSafeEqual } from "crypto";
import type { BillingPlan, BillingStatus } from "../../db/models/user.model";
import type { User } from "../auth/types";
import {
  findUserById,
  findUserByPaddleCustomerId,
  findUserByPaddleSubscriptionId,
  findUserByPaddleTransactionId,
  hasProcessedBillingWebhookEvent,
  updateUserBillingForWebhookEvent,
} from "../auth/user.repository";
import { createTransactionCheckout, type PaddleTransactionPayload } from "./paddle.client";
import type {
  BillingCheckoutPayload,
  BillingCheckoutPlan,
  BillingPortalPayload,
} from "./types";

type SupportedBillingEventType =
  | "transaction.completed"
  | "subscription.activated"
  | "subscription.canceled"
  | "subscription.expired"
  | "subscription.past_due";

export type PaddleWebhookEvent = {
  eventId: string;
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
  latestPaddleBillingEventAt?: Date | null;
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
  | { status: "ignored"; reason: "duplicate_event" | "invalid_payload" | "stale_event" | "user_not_found" };

const PADDLE_API_BASE = process.env.PADDLE_API_BASE ?? "https://api.paddle.com";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const getConfiguredPaddlePriceIds = () => ({
  pro: process.env.PADDLE_PRO_PRICE_ID ?? "",
  lifetime: process.env.PADDLE_LIFETIME_PRICE_ID ?? "",
});

const getDefaultReturnUrl = () => process.env.PADDLE_DEFAULT_RETURN_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const getConfiguredToleranceSeconds = () => {
  const parsedTolerance = Number(process.env.PADDLE_WEBHOOK_TOLERANCE_SECONDS ?? "5");

  return Number.isFinite(parsedTolerance) && parsedTolerance >= 0
    ? parsedTolerance
    : 5;
};

const readPriceIds = (items: unknown): string[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => (isRecord(item) && isRecord(item.price) ? readString(item.price.id) : undefined))
    .filter((value): value is string => Boolean(value));
};

const resolvePlanFromPriceIds = (priceIds: string[]): BillingPlan | undefined => {
  const configuredPriceIds = getConfiguredPaddlePriceIds();

  if (configuredPriceIds.lifetime && priceIds.includes(configuredPriceIds.lifetime)) {
    return "lifetime";
  }

  if (configuredPriceIds.pro && priceIds.includes(configuredPriceIds.pro)) {
    return "pro";
  }

  return undefined;
};

const readCheckoutUrl = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const data = isRecord(payload.data) ? payload.data : undefined;
  const checkout = data && isRecord(data.checkout) ? data.checkout : undefined;

  return readString(checkout?.url) ?? readString(data?.checkout_url) ?? readString((payload as Record<string, unknown>).url);
};

const readPortalUrl = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const data = isRecord(payload.data) ? payload.data : undefined;
  const urls = data && isRecord(data.urls) ? data.urls : undefined;
  const general = urls && isRecord(urls.general) ? urls.general : undefined;

  return readString(general?.overview) ?? readString((payload as Record<string, unknown>).url);
};

const getCheckoutPriceId = (plan: BillingCheckoutPlan): string => {
  const configuredPriceIds = getConfiguredPaddlePriceIds();
  const priceId = plan === "PRO" ? configuredPriceIds.pro : configuredPriceIds.lifetime;

  if (!priceId) {
    throw new Error(`Missing Paddle price id for ${plan.toLowerCase()} plan`);
  }

  return priceId;
};

const createCustomerPortalSession = async (customerId: string) => {
  const response = await fetch(`${PADDLE_API_BASE}/customers/${customerId}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create Paddle customer portal session");
  }

  return response.json() as Promise<unknown>;
};

const toStoredPlan = (plan: BillingCheckoutPlan): BillingPlan => {
  return plan === "PRO" ? "pro" : "lifetime";
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
      latestPaddleBillingEventAt: new Date(event.occurredAt),
      lifetimeUnlockedAt: new Date(event.occurredAt),
    });
  }

  if (event.eventType === "transaction.completed" && event.plan === "pro") {
    return withPaddleMetadata(user, event, {
      plan: user.plan === "lifetime" ? "lifetime" : "pro",
      billingStatus: "active",
      latestPaddleBillingEventAt: new Date(event.occurredAt),
      subscriptionCanceledAt: null,
      lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
    });
  }

  if (event.eventType === "subscription.activated") {
    return withPaddleMetadata(user, event, {
      plan: user.plan === "lifetime" ? "lifetime" : (event.plan ?? "pro"),
      billingStatus: "active",
      latestPaddleBillingEventAt: new Date(event.occurredAt),
      subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
      subscriptionCanceledAt: null,
      lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
    });
  }

  if (event.eventType === "subscription.past_due") {
    return withPaddleMetadata(
      user,
      event,
      user.plan === "lifetime"
        ? {
            plan: "lifetime",
            billingStatus: "active",
            latestPaddleBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
            lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
          }
        : {
            plan: event.plan ?? (user.plan === "free" ? "pro" : user.plan),
            billingStatus: "past_due",
            latestPaddleBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
          }
    );
  }

  if (event.eventType === "subscription.canceled" || event.eventType === "subscription.expired") {
    return withPaddleMetadata(
      user,
      event,
      user.plan === "lifetime"
        ? {
            plan: "lifetime",
            billingStatus: "active",
            latestPaddleBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: null,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
            lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
          }
        : {
            plan: "free",
            billingStatus: "inactive",
            latestPaddleBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: null,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
          }
    );
  }

  return withPaddleMetadata(user, event, {
    plan: user.plan,
    billingStatus: user.billingStatus,
    latestPaddleBillingEventAt: user.latestPaddleBillingEventAt ? new Date(user.latestPaddleBillingEventAt) : undefined,
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
  const eventId = readString(webhookPayload.event_id);
  const eventType = readString(webhookPayload.event_type);
  const occurredAt = readString(webhookPayload.occurred_at);
  const data = isRecord(webhookPayload.data) ? webhookPayload.data : undefined;

  if (!eventId || !eventType || !occurredAt || !data) {
    return null;
  }

  if (
    eventType !== "transaction.completed" &&
    eventType !== "subscription.activated" &&
    eventType !== "subscription.canceled" &&
    eventType !== "subscription.expired" &&
    eventType !== "subscription.past_due"
  ) {
    return null;
  }

  const customData = isRecord(data.custom_data) ? data.custom_data : undefined;
  const plan = resolvePlanFromPriceIds(readPriceIds(data.items));

  return {
    eventId,
    eventType,
    occurredAt,
    plan,
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
  secret: string,
  now = Date.now()
): boolean => {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const parsedSignature = parseSignatureHeader(signatureHeader);
  if (!parsedSignature) {
    return false;
  }

  const timestampSeconds = Number(parsedSignature.timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  if (Math.abs(Math.floor(now / 1000) - timestampSeconds) > getConfiguredToleranceSeconds()) {
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

  if (user.latestPaddleBillingEventAt && new Date(user.latestPaddleBillingEventAt) > new Date(event.occurredAt)) {
    return { status: "ignored", reason: "stale_event" };
  }

  if (await hasProcessedBillingWebhookEvent(user.id, event.eventId)) {
    return { status: "ignored", reason: "duplicate_event" };
  }

  const update = applyBillingEvent(user, event);
  const updatedUser = await updateUserBillingForWebhookEvent(user.id, event.eventId, new Date(event.occurredAt), update);
  if (!updatedUser) {
    const refreshedUser = await findUserById(user.id);

    if (refreshedUser?.latestPaddleBillingEventAt && new Date(refreshedUser.latestPaddleBillingEventAt) > new Date(event.occurredAt)) {
      return { status: "ignored", reason: "stale_event" };
    }

    return await hasProcessedBillingWebhookEvent(user.id, event.eventId)
      ? { status: "ignored", reason: "duplicate_event" }
      : { status: "ignored", reason: "user_not_found" };
  }

  return { status: "applied", update, userId: updatedUser.id };
};

export const createBillingCheckout = async (payload: PaddleTransactionPayload) => {
  return createTransactionCheckout(payload);
};

export const createCheckoutForUser = async (
  userId: string,
  plan: BillingCheckoutPlan
): Promise<BillingCheckoutPayload> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const response = await createBillingCheckout({
    items: [
      {
        price_id: getCheckoutPriceId(plan),
        quantity: 1,
      },
    ],
    collection_mode: "automatic",
    custom_data: {
      userId,
      plan: toStoredPlan(plan),
    },
    checkout: {
      url: getDefaultReturnUrl(),
    },
    customer_id: user.paddleCustomerId,
  });

  const url = readCheckoutUrl(response);
  if (!url) {
    throw new Error("Failed to create Paddle checkout");
  }

  return { url };
};

export const createPortalForUser = async (userId: string): Promise<BillingPortalPayload> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.plan !== "pro" || user.billingStatus !== "active" || !user.paddleCustomerId) {
    throw new Error("Billing portal is only available for active Pro subscribers");
  }

  const response = await createCustomerPortalSession(user.paddleCustomerId);
  const url = readPortalUrl(response);
  if (!url) {
    throw new Error("Failed to create Paddle customer portal session");
  }

  return { url };
};
