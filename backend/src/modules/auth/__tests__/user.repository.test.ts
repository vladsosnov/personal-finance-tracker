const mockFindOne = jest.fn();

jest.mock("../../../db/models/user.model", () => ({
  UserModel: {
    findOne: mockFindOne,
  },
}));

import { findUserByEmail } from "../user.repository";

const createLeanQuery = (doc: unknown) => ({
  lean: jest.fn().mockResolvedValue(doc),
});

describe("user.repository migration mapping", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
  });

  it("maps a legacy-only doc with subscription and no plan", async () => {
    const legacyDoc = {
      _id: { toString: () => "user-1" },
      email: "legacy@example.com",
      subscription: "Lifetime",
      role: "user",
      primaryCurrency: "USD",
      passwordHash: "hash",
      passwordSalt: "salt",
      tokenVersion: 0,
      emailVerified: true,
      billingStatus: "inactive",
    };

    mockFindOne.mockReturnValueOnce(createLeanQuery(legacyDoc));

    await expect(findUserByEmail("legacy@example.com")).resolves.toMatchObject({
      id: "user-1",
      email: "legacy@example.com",
      plan: "lifetime",
      subscription: "Lifetime",
      billingStatus: "inactive",
    });
  });

  it("maps a normalized-only doc with plan", async () => {
    const normalizedDoc = {
      _id: { toString: () => "user-2" },
      email: "normalized@example.com",
      plan: "pro",
      role: "user",
      primaryCurrency: "USD",
      passwordHash: "hash",
      passwordSalt: "salt",
      tokenVersion: 2,
      emailVerified: false,
      billingStatus: "active",
    };

    mockFindOne.mockReturnValueOnce(createLeanQuery(normalizedDoc));

    await expect(findUserByEmail("normalized@example.com")).resolves.toMatchObject({
      id: "user-2",
      email: "normalized@example.com",
      plan: "pro",
      subscription: "Pro",
      billingStatus: "active",
    });
  });

  it("prefers normalized fields over legacy subscription when both are present", async () => {
    const mixedDoc = {
      _id: { toString: () => "user-3" },
      email: "mixed@example.com",
      plan: "pro",
      subscription: "Lifetime",
      role: "user",
      primaryCurrency: "USD",
      passwordHash: "hash",
      passwordSalt: "salt",
      tokenVersion: 1,
      emailVerified: true,
      billingStatus: "active",
    };

    mockFindOne.mockReturnValueOnce(createLeanQuery(mixedDoc));

    await expect(findUserByEmail("mixed@example.com")).resolves.toMatchObject({
      id: "user-3",
      email: "mixed@example.com",
      plan: "pro",
      subscription: "Pro",
      billingStatus: "active",
    });
  });
});
