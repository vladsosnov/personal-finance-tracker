import type { Request, Response, NextFunction } from "express";

const DEFAULT_TIMEOUT_MS = 30_000;

export const requestTimeoutMiddleware = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ error: "Request timeout" });
      }
    }, timeoutMs);

    res.on("close", () => clearTimeout(timer));
    res.on("finish", () => clearTimeout(timer));
    next();
  };
};
