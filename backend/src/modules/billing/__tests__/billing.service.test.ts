jest.mock("../../auth/user.repository", () => ({
  findUserById: jest.fn(),
  findUserByPaddleCustomerId: jest.fn(),
  findUserByPaddleSubscriptionId: jest.fn(),
  findUserByPaddleTransactionId: jest.fn(),
  hasProcessedBillingWebhookEvent: jest.fn(),
  updateUserBilling: jest.fn(),
  updateUserBillingForWebhookEvent: jest.fn(),
}));

import type { User } from "../../auth/types";
import { applyBillingEvent, processBillingWebhook } from "../billing.service";

const mockedUserRepository = jest.requireMock("../../auth/user.repository") as {
  findUserById: jest.Mock;
  findUserByPaddleCustomerId: jest.Mock;
  findUserByPaddleSubscriptionId: jest.Mock;
  findUserByPaddleTransactionId: jest.Mock;
  hasProcessedBillingWebhookEvent: jest.Mock;
  updateUserBilling: jest.Mock;
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
  });

  it("maps a completed lifetime transaction to lifetime entitlement", async () => {
    const existingUser = makeUser({ plan: "free", billingStatus: "inactive" });
    const lifetimeCompletedEvent = {
      eventId: "evt_lifetime_1",
      eventType: "transaction.completed" as const,
      plan: "lifetime" as const,
      occurredAt: "2026-04-13T10:00:00.000Z",
    };

    const result = applyBillingEvent(existingUser, lifetimeCompletedEvent);

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
      eventType: "subscription.expired" as const,
      plan: "pro" as const,
      occurredAt: "2026-04-13T12:00:00.000Z",
    };

    const result = applyBillingEvent(lifetimeUser, proExpiredEvent);

    expect(result.plan).toBe("lifetime");
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
          plan: "lifetime",
        },
      },
    };

    mockedUserRepository.findUserById.mockResolvedValue(existingUser);
    mockedUserRepository.hasProcessedBillingWebhookEvent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockedUserRepository.updateUserBilling.mockResolvedValue(updatedUser);
    mockedUserRepository.updateUserBillingForWebhookEvent.mockResolvedValue(updatedUser);

    const firstResult = await processBillingWebhook(payload);
    const secondResult = await processBillingWebhook(payload);

    expect(firstResult).toMatchObject({ status: "applied", userId: "user-1" });
    expect(secondResult).toEqual({ status: "ignored", reason: "duplicate_event" });
    expect(mockedUserRepository.updateUserBillingForWebhookEvent).toHaveBeenCalledTimes(1);
  });
});
