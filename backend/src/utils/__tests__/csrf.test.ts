import type { Request, Response, NextFunction } from "express";
import { createCsrfProtection } from "../csrf";

const FRONTEND = "http://localhost:3000";
const csrf = createCsrfProtection(FRONTEND);

const mockReq = (overrides: Partial<Request> = {}): Request =>
  ({
    method: "POST",
    path: "/auth/login",
    headers: {},
    ...overrides,
  }) as unknown as Request;

const mockRes = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe("createCsrfProtection", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  describe("safe methods passthrough", () => {
    it("allows GET requests", () => {
      csrf(mockReq({ method: "GET" }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it("allows HEAD requests", () => {
      csrf(mockReq({ method: "HEAD" }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it("allows OPTIONS requests", () => {
      csrf(mockReq({ method: "OPTIONS" }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("non-protected paths passthrough", () => {
    it("allows POST to /graphql", () => {
      csrf(mockReq({ path: "/graphql" }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it("allows POST to /health", () => {
      csrf(mockReq({ path: "/health" }), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("origin validation", () => {
    it("allows matching origin on /auth/ path", () => {
      csrf(
        mockReq({ headers: { origin: FRONTEND } as Record<string, string> }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("blocks mismatched origin on /auth/ path", () => {
      const res = mockRes();
      csrf(
        mockReq({ headers: { origin: "http://evil.com" } as Record<string, string> }),
        res,
        next
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("allows matching origin on /analytics/ path", () => {
      csrf(
        mockReq({ path: "/analytics/track", headers: { origin: FRONTEND } as Record<string, string> }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("sec-fetch-site handling", () => {
    it("blocks cross-site request with wrong origin", () => {
      const res = mockRes();
      csrf(
        mockReq({
          headers: {
            "sec-fetch-site": "cross-site",
            origin: "http://evil.com",
          } as Record<string, string>,
        }),
        res,
        next
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("allows cross-site request with correct origin", () => {
      csrf(
        mockReq({
          headers: {
            "sec-fetch-site": "cross-site",
            origin: FRONTEND,
          } as Record<string, string>,
        }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("allows same-origin request", () => {
      csrf(
        mockReq({
          headers: { "sec-fetch-site": "same-origin" } as Record<string, string>,
        }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("allows same-site request", () => {
      csrf(
        mockReq({
          headers: { "sec-fetch-site": "same-site" } as Record<string, string>,
        }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("allows sec-fetch-site=none", () => {
      csrf(
        mockReq({
          headers: { "sec-fetch-site": "none" } as Record<string, string>,
        }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("referer fallback", () => {
    it("blocks request with foreign referer and no origin", () => {
      const res = mockRes();
      csrf(
        mockReq({
          headers: { referer: "http://evil.com/page" } as Record<string, string>,
        }),
        res,
        next
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("allows request with matching referer and no origin", () => {
      csrf(
        mockReq({
          headers: { referer: `${FRONTEND}/auth/login` } as Record<string, string>,
        }),
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("allows request with no origin and no referer", () => {
      csrf(mockReq(), mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });
});
