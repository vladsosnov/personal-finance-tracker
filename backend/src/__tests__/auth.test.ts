import {
  hashPassword,
  verifyPassword,
  signJwt,
  signRefreshJwt,
  verifyJwt,
  verifyRefreshJwt,
  buildCookie,
  buildExpiredCookie,
  authCookieHeaders,
  generateSecureToken,
  signAuthTokens,
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
} from "../modules/auth/auth";

describe("auth", () => {
  describe("hashPassword / verifyPassword", () => {
    it("hashes a password and verifies it", () => {
      const { hash, salt } = hashPassword("mypassword");

      expect(hash).toBeTruthy();
      expect(salt).toBeTruthy();
      expect(verifyPassword("mypassword", hash, salt)).toBe(true);
    });

    it("rejects wrong password", () => {
      const { hash, salt } = hashPassword("correctpassword");

      expect(verifyPassword("wrongpassword", hash, salt)).toBe(false);
    });

    it("produces different salts each time", () => {
      const a = hashPassword("same");
      const b = hashPassword("same");

      expect(a.salt).not.toBe(b.salt);
      expect(a.hash).not.toBe(b.hash);
    });
  });

  describe("JWT sign / verify", () => {
    it("signs and verifies an access token", () => {
      const token = signJwt("user-123", 0);
      const result = verifyJwt(token);

      expect(result).toEqual({ userId: "user-123", tokenVersion: 0 });
    });

    it("signs and verifies a refresh token", () => {
      const token = signRefreshJwt("user-456", 3);
      const result = verifyRefreshJwt(token);

      expect(result).toEqual({ userId: "user-456", tokenVersion: 3 });
    });

    it("returns null for undefined token", () => {
      expect(verifyJwt(undefined)).toBeNull();
      expect(verifyRefreshJwt(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(verifyJwt("")).toBeNull();
      expect(verifyRefreshJwt("")).toBeNull();
    });

    it("returns null for malformed token", () => {
      expect(verifyJwt("not.a.valid-token")).toBeNull();
    });

    it("returns null for token with wrong number of parts", () => {
      expect(verifyJwt("only-one-part")).toBeNull();
      expect(verifyJwt("two.parts")).toBeNull();
    });

    it("rejects access token verified as refresh", () => {
      const accessToken = signJwt("user-123");
      expect(verifyRefreshJwt(accessToken)).toBeNull();
    });

    it("rejects refresh token verified as access", () => {
      const refreshToken = signRefreshJwt("user-123");
      expect(verifyJwt(refreshToken)).toBeNull();
    });

    it("rejects tampered token", () => {
      const token = signJwt("user-123");
      const tampered = token.slice(0, -2) + "XX";

      expect(verifyJwt(tampered)).toBeNull();
    });

    it("defaults tokenVersion to 0", () => {
      const token = signJwt("user-123");
      const result = verifyJwt(token);

      expect(result?.tokenVersion).toBe(0);
    });
  });

  describe("buildCookie", () => {
    it("builds a cookie string without Secure in non-production", () => {
      const cookie = buildCookie("test", "value", 3600);

      expect(cookie).toBe("test=value; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600");
    });

    it("includes the cookie name, value, and max-age", () => {
      const cookie = buildCookie("name", "val", 60);

      expect(cookie).toContain("name=val");
      expect(cookie).toContain("Max-Age=60");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Lax");
    });
  });

  describe("buildExpiredCookie", () => {
    it("builds a cookie with Max-Age=0", () => {
      const cookie = buildExpiredCookie("test");

      expect(cookie).toContain("test=");
      expect(cookie).toContain("Max-Age=0");
    });
  });

  describe("authCookieHeaders", () => {
    it("returns two cookie headers (access + refresh)", () => {
      const headers = authCookieHeaders("user-123", 0);

      expect(headers).toHaveLength(2);
      expect(headers[0]).toContain(AUTH_ACCESS_COOKIE);
      expect(headers[1]).toContain(AUTH_REFRESH_COOKIE);
    });
  });

  describe("generateSecureToken", () => {
    it("returns a 64-char hex string", () => {
      const token = generateSecureToken();

      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("generates unique tokens", () => {
      const a = generateSecureToken();
      const b = generateSecureToken();

      expect(a).not.toBe(b);
    });
  });

  describe("signAuthTokens", () => {
    it("returns accessToken and refreshToken", () => {
      const { accessToken, refreshToken } = signAuthTokens("user-1", 0);

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
    });

    it("accessToken is a valid access JWT", () => {
      const { accessToken } = signAuthTokens("user-1", 0);
      const result = verifyJwt(accessToken);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
    });

    it("refreshToken is a valid refresh JWT", () => {
      const { refreshToken } = signAuthTokens("user-1", 0);
      const result = verifyRefreshJwt(refreshToken);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
    });

    it("tokens are different from each other", () => {
      const { accessToken, refreshToken } = signAuthTokens("user-1", 0);

      expect(accessToken).not.toBe(refreshToken);
    });

    it("respects tokenVersion", () => {
      const { accessToken } = signAuthTokens("user-1", 5);
      const result = verifyJwt(accessToken);

      expect(result?.tokenVersion).toBe(5);
    });
  });

  describe("constants", () => {
    it("exports cookie names", () => {
      expect(AUTH_ACCESS_COOKIE).toBe("fgt_access");
      expect(AUTH_REFRESH_COOKIE).toBe("fgt_refresh");
    });
  });

  describe("billing graphql", () => {
    it("returns a checkout url for an authenticated pro upgrade", async () => {
      const createCheckoutForUser = jest.fn().mockResolvedValue({
        url: "https://sandbox.paddle.com/checkout/pro-user-1?return_url=http%3A%2F%2Flocalhost%3A3000%2Fprofile%3Fbilling%3Dreturn%26plan%3Dpro",
      });

      await jest.isolateModulesAsync(async () => {
        jest.doMock("../modules/billing/billing.service", () => ({
          createCheckoutForUser,
          createPortalForUser: jest.fn(),
        }));

        const { graphql } = await import("graphql");
        const { schema, rootValue } = require("../schema");
        const response = await graphql({
          schema,
          source: `
            mutation {
              createBillingCheckout(plan: PRO) {
                url
              }
            }
          `,
          rootValue,
          contextValue: {
            userId: "user-1",
            userRole: "user",
            tokenVersion: 0,
            clientIp: "127.0.0.1",
          },
        });

        expect(response.errors).toBeUndefined();
        expect(response.data).toEqual({
          createBillingCheckout: {
            url: expect.stringContaining("billing%3Dreturn"),
          },
        });
        expect(createCheckoutForUser).toHaveBeenCalledWith("user-1", "PRO");
      });
    });

    it("derives me.subscription from the normalized plan instead of the legacy subscription string", async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock("../modules/auth/user.repository", () => ({
          findUserById: jest.fn().mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            subscription: "Pro",
            billingStatus: "inactive",
            role: "user",
            primaryCurrency: "USD",
            passwordHash: "hash",
            passwordSalt: "salt",
            tokenVersion: 0,
            emailVerified: true,
          }),
          updatePrimaryCurrency: jest.fn(),
        }));

        const { graphql } = await import("graphql");
        const { schema, rootValue } = require("../schema");
        const response = await graphql({
          schema,
          source: `
            query {
              me {
                subscription
                plan
                billingStatus
              }
            }
          `,
          rootValue,
          contextValue: {
            userId: "user-1",
            userRole: "user",
            tokenVersion: 0,
            clientIp: "127.0.0.1",
          },
        });

        expect(response.errors).toBeUndefined();
        expect(response.data).toEqual({
          me: {
            billingStatus: "inactive",
            plan: "free",
            subscription: "Free",
          },
        });
      });
    });
  });
});
