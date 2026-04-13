import type { User } from "../../auth/types";
import { applyBillingEvent } from "../billing.service";

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
  it("maps a completed lifetime transaction to lifetime entitlement", async () => {
    const existingUser = makeUser({ plan: "free", billingStatus: "inactive" });
    const lifetimeCompletedEvent = {
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
      eventType: "subscription.expired" as const,
      plan: "pro" as const,
      occurredAt: "2026-04-13T12:00:00.000Z",
    };

    const result = applyBillingEvent(lifetimeUser, proExpiredEvent);

    expect(result.plan).toBe("lifetime");
  });
});
