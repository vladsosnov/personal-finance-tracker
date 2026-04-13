import {
  emailRegex,
  getEffectivePlan,
  getEffectiveSubscription,
  getMaxGoals,
  getSubscriptionLabel,
  assertFiniteNonNegative,
  assertValidGoalTitle,
  assertValidNote,
  toSafeUser,
  ensureAuthed,
  ensureAdmin,
} from "../validation";

describe("validation utilities", () => {
  describe("emailRegex", () => {
    it("matches valid emails", () => {
      expect(emailRegex.test("user@example.com")).toBe(true);
      expect(emailRegex.test("a@b.co")).toBe(true);
      expect(emailRegex.test("user+tag@domain.org")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(emailRegex.test("")).toBe(false);
      expect(emailRegex.test("notanemail")).toBe(false);
      expect(emailRegex.test("@domain.com")).toBe(false);
      expect(emailRegex.test("user@")).toBe(false);
      expect(emailRegex.test("user @domain.com")).toBe(false);
    });
  });

  describe("getEffectiveSubscription", () => {
    it("returns Free for null user", () => {
      expect(getEffectiveSubscription(null)).toBe("Free");
    });

    it("returns Free for undefined user", () => {
      expect(getEffectiveSubscription(undefined)).toBe("Free");
    });

    it("returns Lifetime for admin", () => {
      expect(getEffectiveSubscription({ subscription: "Free", role: "admin" })).toBe("Lifetime");
    });

    it("returns user subscription for non-admin", () => {
      expect(getEffectiveSubscription({ subscription: "Pro", role: "user" })).toBe("Pro");
    });
  });

  describe("getEffectivePlan", () => {
    it("returns free when user is missing", () => {
      expect(getEffectivePlan(undefined)).toBe("free");
    });

    it("returns lifetime for admins", () => {
      expect(getEffectivePlan({ role: "admin", plan: "free" })).toBe("lifetime");
    });

    it("returns lifetime when unlocked", () => {
      expect(getEffectivePlan({ role: "user", plan: "lifetime" })).toBe("lifetime");
    });
  });

  describe("getSubscriptionLabel", () => {
    it("maps normalized plans to display labels", () => {
      expect(getSubscriptionLabel("free")).toBe("Free");
      expect(getSubscriptionLabel("pro")).toBe("Pro");
      expect(getSubscriptionLabel("lifetime")).toBe("Lifetime");
    });
  });

  describe("getMaxGoals", () => {
    it("returns 3 for free subscription", () => {
      expect(getMaxGoals("free")).toBe(3);
      expect(getMaxGoals("Free")).toBe(3);
    });

    it("returns null for paid subscriptions", () => {
      expect(getMaxGoals("Pro")).toBeNull();
      expect(getMaxGoals("Lifetime")).toBeNull();
    });
  });

  describe("assertFiniteNonNegative", () => {
    it("accepts zero", () => {
      expect(() => assertFiniteNonNegative(0, "Amount")).not.toThrow();
    });

    it("accepts positive numbers", () => {
      expect(() => assertFiniteNonNegative(100, "Amount")).not.toThrow();
    });

    it("throws for negative numbers", () => {
      expect(() => assertFiniteNonNegative(-1, "Amount")).toThrow("Amount cannot be negative");
    });

    it("throws for Infinity", () => {
      expect(() => assertFiniteNonNegative(Infinity, "Amount")).toThrow("Amount cannot be negative");
    });

    it("throws for NaN", () => {
      expect(() => assertFiniteNonNegative(NaN, "Amount")).toThrow("Amount cannot be negative");
    });
  });

  describe("assertValidGoalTitle", () => {
    it("accepts a valid title", () => {
      expect(() => assertValidGoalTitle("My Goal")).not.toThrow();
    });

    it("throws for empty title", () => {
      expect(() => assertValidGoalTitle("")).toThrow("Goal title is required");
    });

    it("throws for whitespace-only title", () => {
      expect(() => assertValidGoalTitle("   ")).toThrow("Goal title is required");
    });

    it("throws for title exceeding 80 characters", () => {
      const longTitle = "a".repeat(81);
      expect(() => assertValidGoalTitle(longTitle)).toThrow("Goal title must be at most 80 characters");
    });

    it("accepts title at exactly 80 characters", () => {
      const title = "a".repeat(80);
      expect(() => assertValidGoalTitle(title)).not.toThrow();
    });
  });

  describe("assertValidNote", () => {
    it("accepts undefined note", () => {
      expect(() => assertValidNote(undefined)).not.toThrow();
    });

    it("accepts empty note", () => {
      expect(() => assertValidNote("")).not.toThrow();
    });

    it("accepts valid note", () => {
      expect(() => assertValidNote("Some note")).not.toThrow();
    });

    it("throws for note exceeding 500 characters", () => {
      const longNote = "a".repeat(501);
      expect(() => assertValidNote(longNote)).toThrow("Note must be at most 500 characters");
    });
  });

  describe("toSafeUser", () => {
    it("maps user fields correctly", () => {
      const user = {
        id: "123",
        email: "user@test.com",
        plan: "pro",
        role: "user",
        primaryCurrency: "USD",
        emailVerified: true,
      };

      expect(toSafeUser(user)).toEqual({
        id: "123",
        email: "user@test.com",
        subscription: "Pro",
        role: "user",
        primaryCurrency: "USD",
        emailVerified: true,
      });
    });

    it("overrides subscription to Lifetime for admin", () => {
      const admin = {
        id: "1",
        email: "admin@test.com",
        plan: "free",
        role: "admin",
        primaryCurrency: "USD",
        emailVerified: true,
      };

      expect(toSafeUser(admin).subscription).toBe("Lifetime");
    });
  });

  describe("ensureAuthed", () => {
    it("returns userId when present", () => {
      expect(ensureAuthed({ userId: "user-1" })).toBe("user-1");
    });

    it("throws when userId is null", () => {
      expect(() => ensureAuthed({ userId: null })).toThrow("Unauthorized");
    });
  });

  describe("ensureAdmin", () => {
    it("returns userId for admin", () => {
      expect(ensureAdmin({ userId: "admin-1", userRole: "admin" })).toBe("admin-1");
    });

    it("throws for non-admin user", () => {
      expect(() => ensureAdmin({ userId: "user-1", userRole: "user" })).toThrow("Forbidden");
    });

    it("throws for unauthenticated user", () => {
      expect(() => ensureAdmin({ userId: null, userRole: "user" })).toThrow("Unauthorized");
    });
  });
});
