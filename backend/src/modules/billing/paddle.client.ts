const PADDLE_API_BASE = process.env.PADDLE_API_BASE ?? "https://api.paddle.com";

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type PaddleTransactionPayload = {
  items: JsonValue[];
  [key: string]: JsonValue | undefined;
};

export const createTransactionCheckout = async (payload: PaddleTransactionPayload) => {
  const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create Paddle checkout");
  }

  return response.json() as Promise<unknown>;
};
