jest.mock("../../auth/user.repository", () => ({
  findUserById: jest.fn(),
  findUserByPaddleCustomerId: jest.fn(),
  findUserByPaddleSubscriptionId: jest.fn(),
  findUserByPaddleTransactionId: jest.fn(),
  hasProcessedBillingWebhookEvent: jest.fn(),
  updateUserBillingForWebhookEvent: jest.fn(),
}));

import { createHmac } from "crypto";
import type { User } from "../../auth/types";
import {
  applyBillingEvent,
  processBillingWebhook,
  verifyPaddleWebhookSignature,
} from "../billing.service";

const mockedUserRepository = jest.requireMock("../../auth/user.repository") as {
  findUserById: jest.Mock;
  findUserByPaddleCustomerId: jest.Mock;
  findUserByPaddleSubscriptionId: jest.Mock;
  findUserByPaddleTransactionId: jest.Mock;
  hasProcessedBillingWebhookEvent: jest.Mock;
  updateUserBillingForWebhookEvent: jest.Mock;
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
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PADDLE_PRO_PRICE_ID = "pri_pro";
    process.env.PADDLE_LIFETIME_PRICE_ID = "pri_life";
  });

  afterEach(() => {
    delete process.env.PADDLE_PRO_PRICE_ID;
    delete process.env.PADDLE_LIFETIME_PRICE_ID;
  });

  it("uses Paddle price ids rather than custom_data.plan for lifetime unlocks", async () => {
    const existingUser = makeUser({ plan: "free", billingStatus: "inactive" });
    const updatedUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-13T10:00:00.000Z",
    });
    const payload = {
      event_id: "evt_lifetime_1",
      event_type: "transaction.completed",
      occurred_at: "2026-04-13T10:00:00.000Z",
      data: {
        id: "txn_01",
        customer_id: "ctm_01",
        items: [
          {
            price: {
              id: "pri_life",
            },
          },
        ],
        custom_data: {
          userId: "user-1",
          plan: "pro",
        },
      },
    };

    mockedUserRepository.findUserById.mockResolvedValue(existingUser);
    mockedUserRepository.hasProcessedBillingWebhookEvent.mockResolvedValue(false);
    mockedUserRepository.updateUserBillingForWebhookEvent.mockResolvedValue(updatedUser);

    const result = await processBillingWebhook(payload);

    expect(result).toMatchObject({ status: "applied", userId: "user-1" });
    expect(mockedUserRepository.updateUserBillingForWebhookEvent).toHaveBeenCalledWith(
      "user-1",
      "evt_lifetime_1",
      new Date("2026-04-13T10:00:00.000Z"),
      expect.objectContaining({
        plan: "lifetime",
        billingStatus: "active",
      })
    );
  });

  it("does not downgrade a lifetime user when a pro subscription is canceled", async () => {
    const lifetimeUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-10T10:00:00.000Z",
    });
    const proCanceledEvent = {
      eventId: "evt_canceled_1",
      eventType: "subscription.canceled",
      plan: "pro",
      occurredAt: "2026-04-13T12:00:00.000Z",
    } as const;

    const result = applyBillingEvent(lifetimeUser, proCanceledEvent as never);

    expect(result.plan).toBe("lifetime");
    expect(result.billingStatus).toBe("active");
  });

  it("does not downgrade a lifetime user when a pro subscription expires", async () => {
    const lifetimeUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-10T10:00:00.000Z",
    });
    const proExpiredEvent = {
      eventId: "evt_expired_1",
      eventType: "subscription.expired",
      plan: "pro",
      occurredAt: "2026-04-13T12:00:00.000Z",
    } as const;

    const result = applyBillingEvent(lifetimeUser, proExpiredEvent as never);

    expect(result.plan).toBe("lifetime");
    expect(result.billingStatus).toBe("active");
  });

  it("marks a pro subscription as past_due when Paddle sends subscription.past_due", async () => {
    const proUser = makeUser({
      plan: "pro",
      billingStatus: "active",
      subscription: "Pro",
      paddleSubscriptionId: "sub_01",
    });
    const pastDueEvent = {
      eventId: "evt_past_due_1",
      eventType: "subscription.past_due",
      plan: "pro",
      occurredAt: "2026-04-13T12:00:00.000Z",
      renewsAt: "2026-05-13T12:00:00.000Z",
    } as const;

    const result = applyBillingEvent(proUser, pastDueEvent as never);

    expect(result.plan).toBe("pro");
    expect(result.billingStatus).toBe("past_due");
  });

  it("skips duplicate Paddle webhook deliveries without reapplying billing changes", async () => {
    const existingUser = makeUser({ plan: "free", billingStatus: "inactive" });
    const updatedUser = makeUser({
      plan: "lifetime",
      billingStatus: "active",
      subscription: "Lifetime",
      lifetimeUnlockedAt: "2026-04-13T10:00:00.000Z",
    });
    const payload = {
      event_id: "evt_01",
      event_type: "transaction.completed",
      occurred_at: "2026-04-13T10:00:00.000Z",
      data: {
        id: "txn_01",
        customer_id: "ctm_01",
        custom_data: {
          userId: "user-1",
        },
        items: [{ price: { id: "pri_life" } }],
      },
    };

    mockedUserRepository.findUserById.mockResolvedValue(existingUser);
    mockedUserRepository.hasProcessedBillingWebhookEvent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockedUserRepository.updateUserBillingForWebhookEvent.mockResolvedValue(updatedUser);

    const firstResult = await processBillingWebhook(payload);
    const secondResult = await processBillingWebhook(payload);

    expect(firstResult).toMatchObject({ status: "applied", userId: "user-1" });
    expect(secondResult).toEqual({ status: "ignored", reason: "duplicate_event" });
    expect(mockedUserRepository.updateUserBillingForWebhookEvent).toHaveBeenCalledTimes(1);
  });

  it("ignores stale older billing events before mutating state", async () => {
    const existingUser = {
      ...makeUser({
        plan: "pro",
        billingStatus: "active",
        subscription: "Pro",
        paddleSubscriptionId: "sub_01",
      }),
      latestPaddleBillingEventAt: "2026-04-13T12:00:00.000Z",
    };
    const payload = {
      event_id: "evt_old_01",
      event_type: "subscription.canceled",
      occurred_at: "2026-04-13T11:00:00.000Z",
      data: {
        id: "sub_01",
        customer_id: "ctm_01",
        canceled_at: "2026-04-13T11:00:00.000Z",
        items: [{ price: { id: "pri_pro" } }],
      },
    };

    mockedUserRepository.findUserByPaddleSubscriptionId.mockResolvedValue(existingUser);

    const result = await processBillingWebhook(payload);

    expect(result).toEqual({ status: "ignored", reason: "stale_event" });
    expect(mockedUserRepository.updateUserBillingForWebhookEvent).not.toHaveBeenCalled();
  });

  it("rejects webhook signatures with stale timestamps", () => {
    const rawBody = JSON.stringify({ ok: true });
    const secret = "whsec_test";
    const oldTimestamp = Math.floor(Date.now() / 1000) - 3600;
    const signedPayload = `${oldTimestamp}:${rawBody}`;
    const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
    const header = `ts=${oldTimestamp};h1=${signature}`;

    const result = verifyPaddleWebhookSignature(rawBody, header, secret);

    expect(result).toBe(false);
  });
});
