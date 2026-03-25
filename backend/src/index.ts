import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createHandler } from "graphql-http/lib/use/express";
import mongoose from "mongoose";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  authCookieHeaders,
  buildExpiredCookie,
  generateSecureToken,
  verifyJwt,
  verifyRefreshJwt,
} from "./auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { graphQlDocsHtml } from "./graphql-docs";
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  resetPassword,
  setEmailVerificationToken,
  setPasswordResetToken,
  verifyEmail,
} from "./modules/auth/user.repository";
import { deleteAllGoalsByUser } from "./modules/goals/goal.repository";
import { deleteAllOperationsByUser } from "./modules/goals/operation.repository";
import { rootValue, schema } from "./schema";
import { isTrackedEvent, recordEvent } from "./modules/analytics/analytics.repository";
import { hashPassword, verifyPassword } from "./auth";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? "4000");
const mongoUri = process.env.MONGODB_URI;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(helmet());
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseCookies = (cookieHeader?: string) =>
  Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
      })
  );

type RateBucket = {
  count: number;
  windowStart: number;
};

// NOTE: In-memory, single-process rate limiter. Resets on restart.
// For multi-instance deployments, replace with Redis-backed solution.
const rateBuckets = new Map<string, RateBucket>();

// Periodically evict expired buckets to prevent memory growth
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.windowStart >= 15 * 60 * 1000) {
      rateBuckets.delete(key);
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);
rateLimitCleanupTimer.unref();

const createRateLimit = (keyPrefix: string, limit: number, windowMs: number) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${keyPrefix}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    const current = rateBuckets.get(key);

    if (!current || now - current.windowStart >= windowMs) {
      rateBuckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (current.count >= limit) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    current.count += 1;
    rateBuckets.set(key, current);
    next();
  };
};

const setAuthCookies = (res: express.Response, userId: string, tokenVersion = 0) => {
  res.setHeader("Set-Cookie", authCookieHeaders(userId, tokenVersion));
};

const clearAuthCookies = (res: express.Response) => {
  res.setHeader("Set-Cookie", [buildExpiredCookie(AUTH_ACCESS_COOKIE), buildExpiredCookie(AUTH_REFRESH_COOKIE)]);
};

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSec: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

app.get("/healthcheck", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {
          mongoPing: false,
        },
      });
      return;
    }

    await mongoose.connection.db.admin().ping();
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {
        mongoPing: true,
      },
    });
  } catch {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      checks: {
        mongoPing: false,
      },
    });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.get("/graphql", (_req, res) => {
    res.type("html").send(graphQlDocsHtml);
  });
}

app.post("/auth/register", createRateLimit("auth-register", 10, 15 * 60 * 1000), async (req, res) => {
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
    res.status(201).json({ user: { id: user.id, email: user.email, subscription: user.subscription } });
  } catch {
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post("/auth/login", createRateLimit("auth-login", 15, 15 * 60 * 1000), async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!emailRegex.test(email) || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    setAuthCookies(res, user.id, user.tokenVersion);
    recordEvent("login_success", user.id).catch(() => {});
    res.json({ user: { id: user.id, email: user.email, subscription: user.subscription } });
  } catch {
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.post("/auth/refresh", createRateLimit("auth-refresh", 30, 15 * 60 * 1000), async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const tokenResult = verifyRefreshJwt(cookies[AUTH_REFRESH_COOKIE]);

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
    res.json({ ok: true });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/auth/logout", (_req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

app.get("/auth/verify-email", createRateLimit("auth-verify-email", 20, 15 * 60 * 1000), async (req, res) => {
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

app.post("/auth/request-verification", createRateLimit("auth-request-verification", 5, 15 * 60 * 1000), async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const tokenResult = verifyJwt(cookies[AUTH_ACCESS_COOKIE]);
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

app.post("/auth/forgot-password", createRateLimit("auth-forgot-password", 5, 15 * 60 * 1000), async (req, res) => {
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

    // Always return success to prevent email enumeration
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

app.post("/auth/reset-password", createRateLimit("auth-reset-password", 10, 15 * 60 * 1000), async (req, res) => {
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

app.post("/auth/delete-account", createRateLimit("auth-delete-account", 5, 15 * 60 * 1000), async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const tokenResult = verifyJwt(cookies[AUTH_ACCESS_COOKIE]);

    if (!tokenResult) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await findUserById(tokenResult.userId);
    if (!user || user.tokenVersion !== tokenResult.tokenVersion) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await deleteAllOperationsByUser(user.id);
    await deleteAllGoalsByUser(user.id);
    await deleteUserById(user.id);

    clearAuthCookies(res);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

app.post("/analytics/track", createRateLimit("analytics-track", 60, 60 * 1000), async (req, res) => {
  try {
    const event = typeof req.body?.event === "string" ? req.body.event : "";
    if (!event || !isTrackedEvent(event)) {
      res.status(400).json({ error: "Invalid event" });
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const tokenResult = verifyJwt(cookies[AUTH_ACCESS_COOKIE]);
    let userId: string | undefined;
    if (tokenResult) {
      const user = await findUserById(tokenResult.userId);
      if (user && user.tokenVersion === tokenResult.tokenVersion) {
        userId = user.id;
      }
    }

    let metadata: Record<string, string> | undefined;
    if (typeof req.body?.metadata === "object" && req.body.metadata !== null) {
      const raw = req.body.metadata as Record<string, unknown>;
      const keys = Object.keys(raw);
      if (keys.length <= 10) {
        const sanitized: Record<string, string> = {};
        for (const key of keys) {
          const k = String(key).slice(0, 64);
          const v = typeof raw[key] === "string" ? (raw[key] as string).slice(0, 256) : "";
          sanitized[k] = v;
        }
        metadata = sanitized;
      }
    }

    await recordEvent(event, userId, metadata);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to track event" });
  }
});

const MAX_GRAPHQL_QUERY_LENGTH = 4000;
const MAX_GRAPHQL_DEPTH = 10;

const countQueryDepth = (query: string): number => {
  let max = 0;
  let current = 0;
  for (const char of query) {
    if (char === "{") {
      current++;
      if (current > max) max = current;
    } else if (char === "}") {
      current--;
    }
  }
  return max;
};

app.post(
  "/graphql",
  createRateLimit("graphql", 300, 60 * 1000),
  (req, res, next) => {
    const query = typeof req.body?.query === "string" ? req.body.query : "";
    if (query.length > MAX_GRAPHQL_QUERY_LENGTH) {
      res.status(400).json({ errors: [{ message: "Query too large" }] });
      return;
    }
    if (countQueryDepth(query) > MAX_GRAPHQL_DEPTH) {
      res.status(400).json({ errors: [{ message: "Query too deeply nested" }] });
      return;
    }
    next();
  },
  createHandler({
    schema,
    rootValue,
    context: async (req) => {
      const cookieHeader =
        typeof req.headers.get === "function" ? req.headers.get("cookie") ?? undefined : ((req.headers as { cookie?: string }).cookie ?? undefined);
      const cookies = parseCookies(cookieHeader);
      const authHeader =
        typeof req.headers.get === "function"
          ? req.headers.get("authorization") ?? undefined
          : ((req.headers as { authorization?: string }).authorization ?? undefined);
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : cookies[AUTH_ACCESS_COOKIE];

      const forwarded = typeof req.headers.get === "function"
        ? req.headers.get("x-forwarded-for") ?? undefined
        : ((req.headers as { "x-forwarded-for"?: string })["x-forwarded-for"] ?? undefined);
      const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";

      const tokenResult = verifyJwt(token);
      let userId: string | null = null;
      let userRole: "user" | "admin" = "user";
      if (tokenResult) {
        const user = await findUserById(tokenResult.userId);
        if (user && user.tokenVersion === tokenResult.tokenVersion) {
          userId = user.id;
          userRole = user.role;
        }
      }
      return { userId, userRole, tokenVersion: tokenResult?.tokenVersion ?? 0, clientIp };
    },
  })
);

const start = async () => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in environment");
  }

  await mongoose.connect(mongoUri);
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

start().catch((error: unknown) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
