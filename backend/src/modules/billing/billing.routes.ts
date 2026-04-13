import express, { Router } from "express";
import {
  processBillingWebhook,
  verifyPaddleWebhookSignature,
} from "./billing.service";

type BillingRoutesConfig = {
  paddleWebhookSecret: string;
};

export const createBillingRouter = ({ paddleWebhookSecret }: BillingRoutesConfig): Router => {
  const router = Router();

  router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!paddleWebhookSecret) {
      res.status(503).json({ error: "Paddle webhook secret is not configured" });
      return;
    }

    const signatureHeader = req.get("Paddle-Signature") ?? "";
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    if (!verifyPaddleWebhookSignature(rawBody, signatureHeader, paddleWebhookSecret)) {
      res.status(400).json({ error: "Invalid Paddle signature" });
      return;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      res.status(400).json({ error: "Invalid Paddle webhook payload" });
      return;
    }

    try {
      const result = await processBillingWebhook(payload);
      res.json({ ok: true, status: result.status });
    } catch {
      res.status(500).json({ error: "Failed to process billing webhook" });
    }
  });

  return router;
};
