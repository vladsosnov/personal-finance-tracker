import type { Request, Response } from "express";
import { createRateLimit } from "../rate-limit";

const mockReq = (ip = "127.0.0.1"): Request =>
  ({ ip }) as unknown as Request;

const mockRes = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("createRateLimit", () => {
  it("allows requests under the limit", () => {
    const limiter = createRateLimit("test-under", 5, 60_000);
    const next = jest.fn();

    for (let i = 0; i < 5; i++) {
      limiter(mockReq(), mockRes(), next);
    }

    expect(next).toHaveBeenCalledTimes(5);
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimit("test-over", 3, 60_000);
    const next = jest.fn();

    for (let i = 0; i < 3; i++) {
      limiter(mockReq(), mockRes(), next);
    }

    const res = mockRes();
    limiter(mockReq(), res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: "Too many requests. Please try again later." });
  });

  it("tracks different IPs separately", () => {
    const limiter = createRateLimit("test-ip", 2, 60_000);
    const next = jest.fn();

    limiter(mockReq("1.1.1.1"), mockRes(), next);
    limiter(mockReq("1.1.1.1"), mockRes(), next);
    limiter(mockReq("2.2.2.2"), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(3);

    // 1.1.1.1 should now be blocked
    const res = mockRes();
    limiter(mockReq("1.1.1.1"), res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // 2.2.2.2 should still be allowed
    limiter(mockReq("2.2.2.2"), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(4);
  });

  it("tracks different key prefixes separately", () => {
    const limiterA = createRateLimit("test-a", 1, 60_000);
    const limiterB = createRateLimit("test-b", 1, 60_000);
    const next = jest.fn();

    limiterA(mockReq(), mockRes(), next);
    limiterB(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("resets after window expires", () => {
    jest.useFakeTimers();
    const windowMs = 1000;
    const limiter = createRateLimit("test-reset", 1, windowMs);
    const next = jest.fn();

    limiter(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    // Should be blocked
    const res = mockRes();
    limiter(mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Advance time past window
    jest.advanceTimersByTime(windowMs + 1);

    limiter(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("handles undefined IP gracefully", () => {
    const limiter = createRateLimit("test-noip", 5, 60_000);
    const next = jest.fn();
    const req = { ip: undefined } as unknown as Request;

    limiter(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
