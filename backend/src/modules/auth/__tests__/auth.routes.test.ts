import express from "express";
import request from "supertest";

describe("auth change password route", () => {
  const verifyJwt = jest.fn();
  const findUserById = jest.fn();
  const updatePasswordByUserId = jest.fn();
  const verifyPassword = jest.fn();
  const hashPassword = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const createApp = async () => {
    jest.doMock("../auth", () => ({
      AUTH_ACCESS_COOKIE: "fgt_access",
      AUTH_REFRESH_COOKIE: "fgt_refresh",
      authCookieHeaders: jest.fn(),
      buildExpiredCookie: jest.fn(),
      generateSecureToken: jest.fn(),
      hashPassword,
      signAuthTokens: jest.fn(),
      verifyJwt,
      verifyPassword,
      verifyRefreshJwt: jest.fn(),
    }));
    jest.doMock("../email", () => ({
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
    }));
    jest.doMock("../../../utils/rate-limit", () => ({
      createRateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    }));
    jest.doMock("../../../utils/parse-cookies", () => ({
      parseCookies: jest.fn(() => ({})),
    }));
    jest.doMock("../../analytics/analytics.repository", () => ({
      recordEvent: jest.fn(),
      deleteAnalyticsByUser: jest.fn(),
    }));
    jest.doMock("../../goals/goal.repository", () => ({
      deleteAllGoalsByUser: jest.fn(),
    }));
    jest.doMock("../../goals/operation.repository", () => ({
      deleteAllOperationsByUser: jest.fn(),
    }));
    jest.doMock("../user.repository", () => ({
      createUser: jest.fn(),
      createGoogleUser: jest.fn(),
      deleteUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByGoogleId: jest.fn(),
      findUserById,
      linkGoogleId: jest.fn(),
      resetPassword: jest.fn(),
      setEmailVerificationToken: jest.fn(),
      setPasswordResetToken: jest.fn(),
      updatePasswordByUserId,
      verifyEmail: jest.fn(),
    }));

    const { createAuthRouter } = await import("../auth.routes.js");
    const app = express();
    app.use(express.json());
    app.use("/auth", createAuthRouter({
      frontendOrigin: "http://localhost:3000",
      googleClientId: "",
      googleClientSecret: "",
      googleRedirectUri: "",
      basePath: "",
    }));
    return app;
  };

  it("changes the password for an authenticated user with the correct current password", async () => {
    verifyJwt.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    findUserById.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      tokenVersion: 0,
      passwordHash: "stored-hash",
      passwordSalt: "stored-salt",
    });
    verifyPassword.mockReturnValue(true);
    hashPassword.mockReturnValue({ hash: "new-hash", salt: "new-salt" });
    updatePasswordByUserId.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      tokenVersion: 1,
    });
    const app = await createApp();

    const response = await request(app)
      .post("/auth/change-password")
      .set("Authorization", "Bearer token")
      .send({ currentPassword: "oldpassword", newPassword: "newpassword123" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(verifyPassword).toHaveBeenCalledWith("oldpassword", "stored-hash", "stored-salt");
    expect(updatePasswordByUserId).toHaveBeenCalledWith("user-1", "new-hash", "new-salt");
  });

  it("rejects incorrect current password", async () => {
    verifyJwt.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    findUserById.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      tokenVersion: 0,
      passwordHash: "stored-hash",
      passwordSalt: "stored-salt",
    });
    verifyPassword.mockReturnValue(false);
    const app = await createApp();

    const response = await request(app)
      .post("/auth/change-password")
      .set("Authorization", "Bearer token")
      .send({ currentPassword: "wrong", newPassword: "newpassword123" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Current password is incorrect" });
    expect(updatePasswordByUserId).not.toHaveBeenCalled();
  });

  it("rejects invalid new password length", async () => {
    verifyJwt.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    findUserById.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      tokenVersion: 0,
      passwordHash: "stored-hash",
      passwordSalt: "stored-salt",
    });
    const app = await createApp();

    const response = await request(app)
      .post("/auth/change-password")
      .set("Authorization", "Bearer token")
      .send({ currentPassword: "oldpassword", newPassword: "short" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Password must be between 8 and 128 characters" });
  });

  it("requires authentication", async () => {
    verifyJwt.mockReturnValue(null);
    const app = await createApp();

    const response = await request(app)
      .post("/auth/change-password")
      .send({ currentPassword: "oldpassword", newPassword: "newpassword123" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});
