import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import mongoose from "mongoose";
import { verifyJwt } from "./auth";
import { rootValue, schema } from "./schema";
import { openApiSpec, swaggerHtml } from "./swagger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? "4000");
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

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

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/docs", (_req, res) => {
  res.type("html").send(swaggerHtml);
});

app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue,
    context: async (req) => {
      const authHeader =
        typeof req.headers.get === "function"
          ? req.headers.get("authorization") ?? undefined
          : ((req.headers as { authorization?: string }).authorization ?? undefined);
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
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
