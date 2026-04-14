import Stripe from "stripe";

const createStripeClient = (apiKey: string) => new Stripe(apiKey);

let stripeClient: ReturnType<typeof createStripeClient> | null = null;

export const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is required in environment");
  }

  stripeClient = createStripeClient(apiKey);
  return stripeClient;
};
