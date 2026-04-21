import type { BillingPlan, BillingStatus } from "../../db/models/user.model";
import type { User } from "../auth/types";
import {
  findUserById,
  findUserByStripeCheckoutSessionId,
  findUserByStripeCustomerId,
  findUserByStripeSubscriptionId,
  hasProcessedBillingWebhookEvent,
  updateUserBillingForWebhookEvent,
} from "../auth/user.repository";
import { getStripeClient } from "./stripe.client";
import type {
  BillingCheckoutPayload,
  BillingCheckoutPlan,
  BillingPortalPayload,
} from "./types";

type SupportedBillingEventType =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted";

export type StripeBillingEvent = {
  eventId: string;
  eventType: SupportedBillingEventType;
  occurredAt: string;
  plan?: BillingPlan;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  checkoutSessionId?: string;
  renewsAt?: string;
  canceledAt?: string;
  subscriptionStatus?: string;
};

export type BillingUpdate = {
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

type ProcessBillingWebhookResult =
  | { status: "applied"; update: BillingUpdate; userId: string }
  | { status: "ignored"; reason: "duplicate_event" | "invalid_payload" | "stale_event" | "user_not_found" };

type StripeIdLike = string | { id: string } | null | undefined;

type StripeCheckoutSessionLike = {
  id: string;
  mode?: string | null;
  customer?: StripeIdLike;
  subscription?: StripeIdLike;
  metadata?: Record<string, string | undefined> | null;
};

type StripeSubscriptionLike = {
  id: string;
  customer?: StripeIdLike;
  status?: string;
  canceled_at?: number | null;
  current_period_end?: number | null;
  metadata?: Record<string, string | undefined> | null;
  items: {
    data: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
};

type StripeEventLike = {
  id?: string;
  type?: string;
  created?: number;
  data?: {
    object?: unknown;
  };
};

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const readStripeId = (value: StripeIdLike): string | undefined => {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
};

const getConfiguredStripePriceIds = () => ({
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID ?? "",
});

const getDefaultReturnOrigin = () => process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const getProfileReturnUrl = (plan: BillingCheckoutPlan, state: "return" | "cancel") => {
  const baseUrl = new URL("/profile", state === "return"
    ? (process.env.STRIPE_SUCCESS_RETURN_URL ?? getDefaultReturnOrigin())
    : (process.env.STRIPE_CANCEL_RETURN_URL ?? getDefaultReturnOrigin()));
  baseUrl.searchParams.set("billing", state);
  baseUrl.searchParams.set("plan", plan === "PRO" ? "pro" : "lifetime");
  return baseUrl.toString();
};

const resolvePlanFromPriceIds = (priceIds: string[]): BillingPlan | undefined => {
  const configuredPriceIds = getConfiguredStripePriceIds();

  if (configuredPriceIds.lifetime && priceIds.includes(configuredPriceIds.lifetime)) {
    return "lifetime";
  }

  if (configuredPriceIds.pro && priceIds.includes(configuredPriceIds.pro)) {
    return "pro";
  }

  return undefined;
};

const getCheckoutPriceId = (plan: BillingCheckoutPlan): string => {
  const configuredPriceIds = getConfiguredStripePriceIds();
  const priceId = plan === "PRO" ? configuredPriceIds.pro : configuredPriceIds.lifetime;

  if (!priceId) {
    throw new Error(`Missing Stripe price id for ${plan.toLowerCase()} plan`);
  }

  return priceId;
};

const toStoredPlan = (plan: BillingCheckoutPlan): BillingPlan => {
  return plan === "PRO" ? "pro" : "lifetime";
};

const withStripeMetadata = (user: User, event: StripeBillingEvent, update: BillingUpdate): BillingUpdate => ({
  ...update,
  billingProvider: event.customerId || event.subscriptionId || event.checkoutSessionId || user.billingProvider ? "stripe" : undefined,
  stripeCustomerId: event.customerId ?? user.stripeCustomerId,
  stripeSubscriptionId: event.subscriptionId ?? user.stripeSubscriptionId,
  stripeCheckoutSessionId: event.checkoutSessionId ?? user.stripeCheckoutSessionId,
});

const toIsoFromUnixSeconds = (value: number | null | undefined): string | undefined => {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : undefined;
};

const toIsoFromStripeEvent = (created: number): string => {
  return new Date(created * 1000).toISOString();
};

const getSubscriptionBillingStatus = (status: string | undefined): BillingStatus => {
  if (status === "past_due" || status === "unpaid") {
    return "past_due";
  }

  if (status === "canceled") {
    return "inactive";
  }

  return "active";
};

const parseStripeBillingEvent = (payload: unknown): StripeBillingEvent | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const event = payload as StripeEventLike;
  if (!event.id || !event.type || typeof event.created !== "number" || !event.data?.object) {
    return null;
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return null;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as StripeCheckoutSessionLike;
    const metadata = session.metadata ?? {};

    return {
      eventId: event.id,
      eventType: event.type,
      occurredAt: toIsoFromStripeEvent(event.created),
      plan: (readString(metadata.plan) as BillingPlan | undefined) ?? (session.mode === "payment" ? "lifetime" : "pro"),
      userId: readString(metadata.userId),
      customerId: readStripeId(session.customer),
      subscriptionId: readStripeId(session.subscription),
      checkoutSessionId: session.id,
    };
  }

  const subscription = event.data.object as StripeSubscriptionLike;
  const metadata = subscription.metadata ?? {};
  const priceIds = subscription.items.data
    .map((item: { price?: { id?: string | null } | null }) => item.price?.id)
    .filter((value): value is string => Boolean(value));
  const plan = (readString(metadata.plan) as BillingPlan | undefined) ?? resolvePlanFromPriceIds(priceIds) ?? "pro";

  return {
    eventId: event.id,
    eventType: event.type,
    occurredAt: toIsoFromStripeEvent(event.created),
    plan,
    userId: readString(metadata.userId),
    customerId: readStripeId(subscription.customer),
    subscriptionId: subscription.id,
    renewsAt: toIsoFromUnixSeconds(subscription.current_period_end),
    canceledAt: toIsoFromUnixSeconds(subscription.canceled_at),
    subscriptionStatus: subscription.status,
  };
};

export const applyBillingEvent = (user: User, event: StripeBillingEvent): BillingUpdate => {
  if (event.eventType === "checkout.session.completed" && event.plan === "lifetime") {
    return withStripeMetadata(user, event, {
      plan: "lifetime",
      billingStatus: "active",
      latestBillingEventAt: new Date(event.occurredAt),
      lifetimeUnlockedAt: new Date(event.occurredAt),
    });
  }

  if (event.eventType === "checkout.session.completed" && event.plan === "pro") {
    return withStripeMetadata(user, event, {
      plan: user.plan === "lifetime" ? "lifetime" : "pro",
      billingStatus: "active",
      latestBillingEventAt: new Date(event.occurredAt),
      subscriptionCanceledAt: null,
      lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
    });
  }

  if (event.eventType === "customer.subscription.created" || event.eventType === "customer.subscription.updated") {
    return withStripeMetadata(
      user,
      event,
      user.plan === "lifetime"
        ? {
            plan: "lifetime",
            billingStatus: "active",
            latestBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : null,
            lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
          }
        : {
            plan: event.plan ?? "pro",
            billingStatus: getSubscriptionBillingStatus(event.subscriptionStatus),
            latestBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: event.renewsAt ? new Date(event.renewsAt) : undefined,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : null,
          }
    );
  }

  if (event.eventType === "customer.subscription.deleted") {
    return withStripeMetadata(
      user,
      event,
      user.plan === "lifetime"
        ? {
            plan: "lifetime",
            billingStatus: "active",
            latestBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: null,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
            lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
          }
        : {
            plan: "free",
            billingStatus: "inactive",
            latestBillingEventAt: new Date(event.occurredAt),
            subscriptionRenewsAt: null,
            subscriptionCanceledAt: event.canceledAt ? new Date(event.canceledAt) : new Date(event.occurredAt),
          }
    );
  }

  return withStripeMetadata(user, event, {
    plan: user.plan,
    billingStatus: user.billingStatus,
    latestBillingEventAt: user.latestBillingEventAt ? new Date(user.latestBillingEventAt) : undefined,
    subscriptionRenewsAt: user.subscriptionRenewsAt ? new Date(user.subscriptionRenewsAt) : undefined,
    subscriptionCanceledAt: user.subscriptionCanceledAt ? new Date(user.subscriptionCanceledAt) : undefined,
    lifetimeUnlockedAt: user.lifetimeUnlockedAt ? new Date(user.lifetimeUnlockedAt) : undefined,
  });
};

const resolveUserForEvent = async (event: StripeBillingEvent): Promise<User | undefined> => {
  if (event.userId) {
    const user = await findUserById(event.userId);
    if (user) return user;
  }

  if (event.subscriptionId) {
    const user = await findUserByStripeSubscriptionId(event.subscriptionId);
    if (user) return user;
  }

  if (event.customerId) {
    const user = await findUserByStripeCustomerId(event.customerId);
    if (user) return user;
  }

  if (event.checkoutSessionId) {
    return findUserByStripeCheckoutSessionId(event.checkoutSessionId);
  }

  return undefined;
};

export const verifyStripeWebhookEvent = (rawBody: string, signatureHeader: string, secret: string) => {
  return getStripeClient().webhooks.constructEvent(rawBody, signatureHeader, secret);
};

export const processBillingWebhook = async (payload: unknown): Promise<ProcessBillingWebhookResult> => {
  const event = parseStripeBillingEvent(payload);
  if (!event) {
    return { status: "ignored", reason: "invalid_payload" };
  }

  const user = await resolveUserForEvent(event);
  if (!user) {
    return { status: "ignored", reason: "user_not_found" };
  }

  if (user.latestBillingEventAt && new Date(user.latestBillingEventAt) > new Date(event.occurredAt)) {
    return { status: "ignored", reason: "stale_event" };
  }

  if (await hasProcessedBillingWebhookEvent(user.id, event.eventId)) {
    return { status: "ignored", reason: "duplicate_event" };
  }

  const update = applyBillingEvent(user, event);
  const updatedUser = await updateUserBillingForWebhookEvent(user.id, event.eventId, new Date(event.occurredAt), update);
  if (!updatedUser) {
    const refreshedUser = await findUserById(user.id);

    if (refreshedUser?.latestBillingEventAt && new Date(refreshedUser.latestBillingEventAt) > new Date(event.occurredAt)) {
      return { status: "ignored", reason: "stale_event" };
    }

    return await hasProcessedBillingWebhookEvent(user.id, event.eventId)
      ? { status: "ignored", reason: "duplicate_event" }
      : { status: "ignored", reason: "user_not_found" };
  }

  return { status: "applied", update, userId: updatedUser.id };
};

export const createCheckoutForUser = async (
  userId: string,
  plan: BillingCheckoutPlan
): Promise<BillingCheckoutPayload> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: plan === "PRO" ? "subscription" : "payment",
    line_items: [
      {
        price: getCheckoutPriceId(plan),
        quantity: 1,
      },
    ],
    success_url: getProfileReturnUrl(plan, "return"),
    cancel_url: getProfileReturnUrl(plan, "cancel"),
    client_reference_id: userId,
    customer: user.stripeCustomerId,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    metadata: {
      userId,
      plan: toStoredPlan(plan),
    },
    subscription_data: plan === "PRO"
      ? {
          metadata: {
            userId,
            plan: "pro",
          },
        }
      : undefined,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session");
  }

  return { url: session.url };
};

export const cancelStripeSubscription = async (subscriptionId: string): Promise<void> => {
  await getStripeClient().subscriptions.cancel(subscriptionId);
};

export const createPortalForUser = async (userId: string): Promise<BillingPortalPayload> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.plan !== "pro" || user.billingStatus !== "active" || !user.stripeCustomerId) {
    throw new Error("Billing portal is only available for active Pro subscribers");
  }

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: new URL("/profile", getDefaultReturnOrigin()).toString(),
  });

  return { url: session.url };
};
