import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import mongoose from "mongoose";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  authCookieHeaders,
  buildExpiredCookie,
  verifyJwt,
  verifyRefreshJwt,
} from "./auth";
import { graphQlDocsHtml } from "./graphql-docs";
import { createUser, findUserByEmail, findUserById } from "./modules/auth/user.repository";
import { rootValue, schema } from "./schema";
import { hashPassword, verifyPassword } from "./auth";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? "4000");
const mongoUri = process.env.MONGODB_URI;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());

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

// NOTE: This rate limiter is in-memory and single-process only.
// State resets on every server restart and is not shared across multiple instances.
// For multi-instance deployments, replace with a distributed solution (e.g. Redis).
const rateBuckets = new Map<string, RateBucket>();

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

const setAuthCookies = (res: express.Response, userId: string) => {
  res.setHeader("Set-Cookie", authCookieHeaders(userId));
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

app.get("/graphql", (_req, res) => {
  res.type("html").send(graphQlDocsHtml);
});

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
    setAuthCookies(res, user.id);
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

    setAuthCookies(res, user.id);
    res.json({ user: { id: user.id, email: user.email, subscription: user.subscription } });
  } catch {
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.post("/auth/refresh", createRateLimit("auth-refresh", 30, 15 * 60 * 1000), async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const userId = verifyRefreshJwt(cookies[AUTH_REFRESH_COOKIE]);

    if (!userId || !(await findUserById(userId))) {
      clearAuthCookies(res);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    setAuthCookies(res, userId);
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

app.post(
  "/graphql",
  createRateLimit("graphql", 300, 60 * 1000),
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
      return { userId: verifyJwt(token) };
    },
  })
);

const start = async () => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in environment");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
};

start().catch((error: unknown) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
