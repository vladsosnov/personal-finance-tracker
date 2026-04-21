import { Router } from "express";
import type { Response } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  authCookieHeaders,
  buildExpiredCookie,
  generateSecureToken,
  hashPassword,
  signAuthTokens,
  verifyJwt,
  verifyPassword,
  verifyRefreshJwt,
} from "./auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { isAccountLocked, recordFailedAttempt, clearAttempts } from "./login-attempts";
import { createRateLimit } from "../../utils/rate-limit";
import { parseCookies } from "../../utils/parse-cookies";
import { emailRegex } from "../../utils/validation";
import { recordEvent } from "../analytics/analytics.repository";
import { cancelStripeSubscription } from "../billing/billing.service";
import { deleteAllGoalsByUser } from "../goals/goal.repository";
import { deleteAllOperationsByUser } from "../goals/operation.repository";
import { deleteAnalyticsByUser } from "../analytics/analytics.repository";
import {
  createUser,
  createGoogleUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  findUserByGoogleId,
  linkGoogleId,
  resetPassword,
  setEmailVerificationToken,
  setPasswordResetToken,
  updatePasswordByUserId,
  verifyEmail,
} from "./user.repository";

type AuthRoutesConfig = {
  frontendOrigin: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  basePath: string;
};

const setAuthCookies = (res: Response, userId: string, tokenVersion = 0) => {
  res.setHeader("Set-Cookie", authCookieHeaders(userId, tokenVersion));
};

const clearAuthCookies = (res: Response) => {
  res.setHeader("Set-Cookie", [buildExpiredCookie(AUTH_ACCESS_COOKIE), buildExpiredCookie(AUTH_REFRESH_COOKIE)]);
};

export const createAuthRouter = (config: AuthRoutesConfig): Router => {
  const router = Router();
  const { frontendOrigin, googleClientId, googleClientSecret, googleRedirectUri, basePath } = config;

  const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

  router.get("/google", createRateLimit("auth-google", 20, 15 * 60 * 1000), (req, res) => {
    if (!googleClientId) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  router.get("/google/callback", createRateLimit("auth-google-callback", 20, 15 * 60 * 1000), async (req, res) => {
    const frontendAuthUrl = `${frontendOrigin}${basePath}/auth`;
    try {
      const code = typeof req.query.code === "string" ? req.query.code : "";
      if (!code) {
        res.redirect(`${frontendAuthUrl}?error=google_failed`);
        return;
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: googleRedirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenRes.ok) {
        res.redirect(`${frontendAuthUrl}?error=google_failed`);
        return;
      }

      const tokenData = (await tokenRes.json()) as { id_token?: string };
      const idToken = tokenData.id_token;
      if (!idToken || !googleClient) {
        res.redirect(`${frontendAuthUrl}?error=google_failed`);
        return;
      }

      // Verify the ID token signature using Google's public keys
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      const googlePayload = ticket.getPayload();

      if (!googlePayload) {
        res.redirect(`${frontendAuthUrl}?error=google_failed`);
        return;
      }

      const googleId = googlePayload.sub;
      const email = googlePayload.email?.trim().toLowerCase();

      if (!googleId || !email) {
        res.redirect(`${frontendAuthUrl}?error=google_failed`);
        return;
      }

      let user = await findUserByGoogleId(googleId);

      if (!user) {
        const existing = await findUserByEmail(email);
        if (existing) {
          if (!existing.emailVerified) {
            res.redirect(`${frontendAuthUrl}?error=google_link_unverified`);
            return;
          }
          await linkGoogleId(existing.id, googleId);
          user = { ...existing, googleId };
        } else {
          user = await createGoogleUser(email, googleId);
          recordEvent("register_success", user.id).catch(() => {});
        }
      }

      setAuthCookies(res, user.id, user.tokenVersion);
      recordEvent("login_success", user.id).catch(() => {});

      // Pass tokens via URL fragment (#) instead of query params to avoid
      // them appearing in server logs, Referer headers, and browser history
      const { accessToken, refreshToken } = signAuthTokens(user.id, user.tokenVersion);
      const fragment = `access_token=${accessToken}&refresh_token=${refreshToken}`;
      res.redirect(`${frontendOrigin}${basePath}/goals#${fragment}`);
    } catch {
      res.redirect(`${frontendAuthUrl}?error=google_failed`);
    }
  });

  router.post("/register", createRateLimit("auth-register", 10, 15 * 60 * 1000), async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Valid email is required" });
        return;
      }

      if (password.length < 8 || password.length > 128) {
        res.status(400).json({ error: "Password must be between 8 and 128 characters" });
        return;
      }

      if (await findUserByEmail(email)) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }

      const { hash, salt } = hashPassword(password);
      const user = await createUser(email, hash, salt);

      const verificationToken = generateSecureToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await setEmailVerificationToken(user.id, verificationToken, verificationExpiry);
      sendVerificationEmail(email, verificationToken).catch(() => {});

      setAuthCookies(res, user.id, user.tokenVersion);
      recordEvent("register_success", user.id).catch(() => {});
      res.status(201).json({ user: { id: user.id, email: user.email, subscription: user.subscription }, ...signAuthTokens(user.id, user.tokenVersion) });
    } catch {
      res.status(500).json({ error: "Failed to register" });
    }
  });

  router.post("/login", createRateLimit("auth-login", 15, 15 * 60 * 1000), async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (!emailRegex.test(email) || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      if (isAccountLocked(email)) {
        res.status(429).json({ error: "Too many failed attempts. Please try again in 15 minutes." });
        return;
      }

      const user = await findUserByEmail(email);
      if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        recordFailedAttempt(email);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      clearAttempts(email);
      setAuthCookies(res, user.id, user.tokenVersion);
      recordEvent("login_success", user.id).catch(() => {});
      res.json({ user: { id: user.id, email: user.email, subscription: user.subscription }, ...signAuthTokens(user.id, user.tokenVersion) });
    } catch {
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  router.post("/refresh", createRateLimit("auth-refresh", 30, 15 * 60 * 1000), async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
      const tokenResult = verifyRefreshJwt(bearerToken ?? cookies[AUTH_REFRESH_COOKIE]);

      if (!tokenResult) {
        clearAuthCookies(res);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await findUserById(tokenResult.userId);
      if (!user || user.tokenVersion !== tokenResult.tokenVersion) {
        clearAuthCookies(res);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      setAuthCookies(res, user.id, user.tokenVersion);
      res.json({ ok: true, ...signAuthTokens(user.id, user.tokenVersion) });
    } catch {
      clearAuthCookies(res);
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  router.post("/logout", (_req, res) => {
    clearAuthCookies(res);
    res.json({ ok: true });
  });

  router.get("/verify-email", createRateLimit("auth-verify-email", 20, 15 * 60 * 1000), async (req, res) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const user = await verifyEmail(token);
      if (!user) {
        res.status(400).json({ error: "Invalid or expired verification link" });
        return;
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  router.post("/request-verification", createRateLimit("auth-request-verification", 5, 15 * 60 * 1000), async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
      const tokenResult = verifyJwt(bearerToken ?? cookies[AUTH_ACCESS_COOKIE]);
      if (!tokenResult) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await findUserById(tokenResult.userId);
      if (!user || user.tokenVersion !== tokenResult.tokenVersion) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.emailVerified) {
        res.json({ ok: true, message: "Email already verified" });
        return;
      }

      const verificationToken = generateSecureToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await setEmailVerificationToken(user.id, verificationToken, verificationExpiry);
      await sendVerificationEmail(user.email, verificationToken);

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  router.post("/forgot-password", createRateLimit("auth-forgot-password", 5, 15 * 60 * 1000), async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      if (!emailRegex.test(email)) {
        res.json({ ok: true });
        return;
      }

      const user = await findUserByEmail(email);
      if (user) {
        const resetToken = generateSecureToken();
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
        await setPasswordResetToken(user.id, resetToken, resetExpiry);
        await sendPasswordResetEmail(email, resetToken);
      }

      res.json({ ok: true });
    } catch {
      res.json({ ok: true });
    }
  });

  router.post("/reset-password", createRateLimit("auth-reset-password", 10, 15 * 60 * 1000), async (req, res) => {
    try {
      const token = typeof req.body?.token === "string" ? req.body.token : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      if (password.length < 8 || password.length > 128) {
        res.status(400).json({ error: "Password must be between 8 and 128 characters" });
        return;
      }

      const { hash, salt } = hashPassword(password);
      const user = await resetPassword(token, hash, salt);

      if (!user) {
        res.status(400).json({ error: "Invalid or expired reset link" });
        return;
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  router.post("/change-password", createRateLimit("auth-change-password", 10, 15 * 60 * 1000), async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
      const tokenResult = verifyJwt(bearerToken ?? cookies[AUTH_ACCESS_COOKIE]);

      if (!tokenResult) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await findUserById(tokenResult.userId);
      if (!user || user.tokenVersion !== tokenResult.tokenVersion) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

      if (!currentPassword) {
        res.status(400).json({ error: "Current password is required" });
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 128) {
        res.status(400).json({ error: "Password must be between 8 and 128 characters" });
        return;
      }

      if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      const { hash, salt } = hashPassword(newPassword);
      const updated = await updatePasswordByUserId(user.id, hash, salt);
      if (!updated) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Re-issue tokens with the new tokenVersion so the current session stays valid
      setAuthCookies(res, updated.id, updated.tokenVersion);
      res.json({ ok: true, ...signAuthTokens(updated.id, updated.tokenVersion) });
    } catch {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  router.post("/delete-account", createRateLimit("auth-delete-account", 5, 15 * 60 * 1000), async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
      const tokenResult = verifyJwt(bearerToken ?? cookies[AUTH_ACCESS_COOKIE]);

      if (!tokenResult) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await findUserById(tokenResult.userId);
      if (!user || user.tokenVersion !== tokenResult.tokenVersion) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Cancel active Stripe subscription before deleting data
      if (user.stripeSubscriptionId) {
        try {
          await cancelStripeSubscription(user.stripeSubscriptionId);
        } catch {
          // Proceed with deletion even if Stripe cancel fails
        }
      }

      await Promise.all([
        deleteAllOperationsByUser(user.id),
        deleteAllGoalsByUser(user.id),
        deleteAnalyticsByUser(user.id),
      ]);
      await deleteUserById(user.id);

      clearAuthCookies(res);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  return router;
};
