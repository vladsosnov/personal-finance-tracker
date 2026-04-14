import express, { Router } from "express";
import {
  processBillingWebhook,
  verifyStripeWebhookEvent,
} from "./billing.service";

type BillingRoutesConfig = {
  stripeWebhookSecret: string;
};

export const createBillingRouter = ({ stripeWebhookSecret }: BillingRoutesConfig): Router => {
  const router = Router();

  router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripeWebhookSecret) {
      res.status(503).json({ error: "Stripe webhook secret is not configured" });
      return;
    }

    const signatureHeader = req.get("Stripe-Signature") ?? "";
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    try {
      const event = verifyStripeWebhookEvent(rawBody, signatureHeader, stripeWebhookSecret);
      const result = await processBillingWebhook(event);
      res.json({ ok: true, status: result.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const invalidSignature = message.toLowerCase().includes("signature");

      res.status(invalidSignature ? 400 : 500).json({
        error: invalidSignature ? "Invalid Stripe signature" : "Failed to process billing webhook",
      });
    }
  });

  return router;
};
