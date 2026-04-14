jest.mock("../../auth/user.repository", () => ({
  findUserById: jest.fn(),
  findUserByStripeCustomerId: jest.fn(),
  findUserByStripeSubscriptionId: jest.fn(),
  findUserByStripeCheckoutSessionId: jest.fn(),
  hasProcessedBillingWebhookEvent: jest.fn(),
  updateUserBillingForWebhookEvent: jest.fn(),
}));

const stripeSdkMock = {
  webhooks: {
    constructEvent: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
};

jest.mock("../stripe.client", () => ({
  getStripeClient: jest.fn(() => stripeSdkMock),
}));

import type { User } from "../../auth/types";
import {
  applyBillingEvent,
  createCheckoutForUser,
  createPortalForUser,
  processBillingWebhook,
  verifyStripeWebhookEvent,
} from "../billing.service";

const mockedUserRepository = jest.requireMock("../../auth/user.repository") as {
  findUserById: jest.Mock;
  findUserByStripeCustomerId: jest.Mock;
  findUserByStripeSubscriptionId: jest.Mock;
  findUserByStripeCheckoutSessionId: jest.Mock;
  hasProcessedBillingWebhookEvent: jest.Mock;
  updateUserBillingForWebhookEvent: jest.Mock;
};

const mockedStripeClient = jest.requireMock("../stripe.client") as {
  getStripeClient: jest.Mock;
};

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  email: "user@example.com",
  subscription: "Free",
  plan: "free",
  billingStatus: "inactive",
  role: "user",
  primaryCurrency: "USD",
  passwordHash: "hash",
  passwordSalt: "salt",
  tokenVersion: 0,
  emailVerified: true,
  ...overrides,
});

describe("billing.service", () => {
  const getStripeMocks = () => mockedStripeClient.getStripeClient();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
    process.env.STRIPE_LIFETIME_PRICE_ID = "price_life";
  });

  afterEach(() => {
    delete process.env.STRIPE_PRO_PRICE_ID;
    delete process.env.STRIPE_LIFETIME_PRICE_ID;
  });

  it("creates a Stripe checkout session for Pro", async () => {
    mockedUserRepository.findUserById.mockResolvedValue(makeUser());
    getStripeMocks().checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    const result = await createCheckoutForUser("user-1", "PRO");

    expect(result).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
    expect(getStripeMocks().checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        client_reference_id: "user-1",
      })
    );
  });

  it("creates a Stripe billing portal session for active Pro users", async () => {
    mockedUserRepository.findUserById.mockResolvedValue(makeUser({
      plan: "pro",
      billingStatus: "active",
      subscription: "Pro",
      stripeCustomerId: "cus_123",
    }));
    getStripeMocks().billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/p/session/test_123",
    });

    const result = await createPortalForUser("user-1");

    expect(result).toEqual({ url: "https://billing.stripe.com/p/session/test_123" });
  });

  it("activates lifetime after checkout.session.completed", async () => {
    const existingUser = makeUser({ plan: "free", billingStatus: "inactive" });
    const updatedUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-13T10:00:00.000Z",
    });

    mockedUserRepository.findUserById.mockResolvedValue(existingUser);
    mockedUserRepository.hasProcessedBillingWebhookEvent.mockResolvedValue(false);
    mockedUserRepository.updateUserBillingForWebhookEvent.mockResolvedValue(updatedUser);

    const result = await processBillingWebhook({
      id: "evt_lifetime_1",
      type: "checkout.session.completed",
      created: 1776074400,
      data: {
        object: {
          id: "cs_test_life",
          mode: "payment",
          customer: "cus_123",
          subscription: null,
          metadata: {
            userId: "user-1",
            plan: "lifetime",
          },
        },
      },
    });

    expect(result).toMatchObject({ status: "applied", userId: "user-1" });
    expect(mockedUserRepository.updateUserBillingForWebhookEvent).toHaveBeenCalledWith(
      "user-1",
      "evt_lifetime_1",
      new Date("2026-04-13T10:00:00.000Z"),
      expect.objectContaining({
        plan: "lifetime",
        billingStatus: "active",
        stripeCustomerId: "cus_123",
        stripeCheckoutSessionId: "cs_test_life",
      })
    );
  });

  it("does not downgrade a lifetime user when a pro subscription is deleted", async () => {
    const lifetimeUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-10T10:00:00.000Z",
    });

    const result = applyBillingEvent(lifetimeUser, {
      eventId: "evt_deleted_1",
      eventType: "customer.subscription.deleted",
      plan: "pro",
      occurredAt: "2026-04-13T12:00:00.000Z",
    });

    expect(result.plan).toBe("lifetime");
    expect(result.billingStatus).toBe("active");
  });

  it("marks a pro subscription as past_due when Stripe sends customer.subscription.updated", async () => {
    const proUser = makeUser({
      plan: "pro",
      billingStatus: "active",
      subscription: "Pro",
      stripeSubscriptionId: "sub_123",
    });

    const result = applyBillingEvent(proUser, {
      eventId: "evt_past_due_1",
      eventType: "customer.subscription.updated",
      plan: "pro",
      occurredAt: "2026-04-13T12:00:00.000Z",
      renewsAt: "2026-05-13T12:00:00.000Z",
      subscriptionStatus: "past_due",
    });

    expect(result.plan).toBe("pro");
    expect(result.billingStatus).toBe("past_due");
  });

  it("skips duplicate Stripe webhook deliveries", async () => {
    mockedUserRepository.findUserById.mockResolvedValue(makeUser());
    mockedUserRepository.hasProcessedBillingWebhookEvent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockedUserRepository.updateUserBillingForWebhookEvent.mockResolvedValue(
      makeUser({ plan: "pro", billingStatus: "active", subscription: "Pro" })
    );

    const payload = {
      id: "evt_duplicate_1",
      type: "checkout.session.completed",
      created: 1776074400,
      data: {
        object: {
          id: "cs_test_pro",
          mode: "subscription",
          customer: "cus_123",
          subscription: "sub_123",
          metadata: {
            userId: "user-1",
            plan: "pro",
          },
        },
      },
    };

    const firstResult = await processBillingWebhook(payload);
    const secondResult = await processBillingWebhook(payload);

    expect(firstResult).toMatchObject({ status: "applied", userId: "user-1" });
    expect(secondResult).toEqual({ status: "ignored", reason: "duplicate_event" });
  });

  it("ignores stale older Stripe events", async () => {
    mockedUserRepository.findUserByStripeSubscriptionId.mockResolvedValue({
      ...makeUser({
        plan: "pro",
        billingStatus: "active",
        subscription: "Pro",
        stripeSubscriptionId: "sub_123",
      }),
      latestBillingEventAt: "2026-04-13T12:00:00.000Z",
    });

    const result = await processBillingWebhook({
      id: "evt_old_1",
      type: "customer.subscription.deleted",
      created: 1776070800,
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "canceled",
          canceled_at: 1776070800,
          current_period_end: 1778662800,
          metadata: {
            plan: "pro",
          },
          items: {
            data: [{ price: { id: "price_pro" } }],
          },
        },
      },
    });

    expect(result).toEqual({ status: "ignored", reason: "stale_event" });
  });

  it("delegates Stripe webhook signature verification to the Stripe SDK", () => {
    getStripeMocks().webhooks.constructEvent.mockReturnValue({ id: "evt_1" });

    const result = verifyStripeWebhookEvent("{}", "t=1,v1=test", "whsec_test");

    expect(result).toEqual({ id: "evt_1" });
    expect(getStripeMocks().webhooks.constructEvent).toHaveBeenCalledWith("{}", "t=1,v1=test", "whsec_test");
  });
});
