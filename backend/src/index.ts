import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { logger } from "./utils/logger";
import helmet from "helmet";
import { createHandler } from "graphql-http/lib/use/express";
import mongoose from "mongoose";
import { AUTH_ACCESS_COOKIE, verifyJwt } from "./modules/auth/auth";
import { graphQlDocsHtml } from "./graphql-docs";
import { findUserById } from "./modules/auth/user.repository";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { isTrackedEvent, recordEvent } from "./modules/analytics/analytics.repository";
import { createBillingRouter } from "./modules/billing/billing.routes";
import { rootValue, schema } from "./schema";
import { createCsrfProtection } from "./utils/csrf";
import { parseCookies } from "./utils/parse-cookies";
import { countQueryDepth } from "./utils/query-depth";
import { createRateLimit } from "./utils/rate-limit";
import { requestIdMiddleware } from "./utils/request-id";
import { requestTimeoutMiddleware } from "./utils/request-timeout";

dotenv.config();

if (!process.env.NODE_ENV) {
  logger.warn("NODE_ENV is not set. Defaulting to development behavior.");
}

const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT ?? "4000");
const mongoUri = process.env.MONGODB_URI;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", frontendOrigin],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(
  "/billing",
  createBillingRouter({
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(requestIdMiddleware);
app.use(requestTimeoutMiddleware());
app.use(createCsrfProtection(frontendOrigin));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    };
    if (res.statusCode >= 500) {
      logger.error(logData, "request error");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "client error");
    }
  });
  next();
});

// Auth routes
app.use(
  "/auth",
  createAuthRouter({
    frontendOrigin,
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/auth/google/callback",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  })
);

// Health endpoints
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
        checks: { mongoPing: false },
      });
      return;
    }

    await mongoose.connection.db.admin().ping();
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
      checks: { mongoPing: true },
    });
  } catch {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      checks: { mongoPing: false },
    });
  }
});

// GraphQL playground (dev only)
if (process.env.NODE_ENV !== "production") {
  app.get("/graphql", (_req, res) => {
    res.type("html").send(graphQlDocsHtml);
  });
}

// Analytics
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

// GraphQL
const MAX_GRAPHQL_QUERY_LENGTH = 4000;
const MAX_GRAPHQL_DEPTH = 10;

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

// Server startup
const connectWithRetry = async (uri: string, maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(uri);
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 30_000);
      logger.warn({ attempt, maxRetries, delay }, "MongoDB connection failed, retrying");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const start = async () => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in environment");
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  await connectWithRetry(mongoUri);
  logger.info("MongoDB connected");

  const server = app.listen(port, () => {
    logger.info({ port }, "Backend started");
  });

  const shutdown = async () => {
    logger.info("Shutting down gracefully");
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled rejection");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});

start().catch((error: unknown) => {
  logger.fatal({ err: error }, "Failed to start backend");
  process.exit(1);
});
