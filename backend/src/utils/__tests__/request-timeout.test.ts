import type { Request, Response } from "express";
import { requestTimeoutMiddleware } from "../request-timeout";

const mockReq = () => ({} as Request);

const mockRes = () => {
  const listeners: Record<string, Array<() => void>> = {};
  const res = {
    headersSent: false,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    on: jest.fn((event: string, handler: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    _trigger: (event: string) => {
      for (const h of listeners[event] ?? []) h();
    },
  };
  return res as unknown as Response & { _trigger: (e: string) => void };
};

describe("requestTimeoutMiddleware", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls next immediately", () => {
    const middleware = requestTimeoutMiddleware(5000);
    const next = jest.fn();
    middleware(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("sends 503 after timeout", () => {
    const middleware = requestTimeoutMiddleware(5000);
    const next = jest.fn();
    const res = mockRes();
    middleware(mockReq(), res, next);
    jest.advanceTimersByTime(5001);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: "Request timeout" });
  });

  it("does not send response if already sent", () => {
    const middleware = requestTimeoutMiddleware(5000);
    const next = jest.fn();
    const res = mockRes();
    (res as unknown as { headersSent: boolean }).headersSent = true;
    middleware(mockReq(), res, next);
    jest.advanceTimersByTime(5001);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("clears timer on finish", () => {
    const middleware = requestTimeoutMiddleware(5000);
    const next = jest.fn();
    const res = mockRes();
    middleware(mockReq(), res, next);
    res._trigger("finish");
    jest.advanceTimersByTime(5001);
    expect(res.status).not.toHaveBeenCalled();
  });
});
