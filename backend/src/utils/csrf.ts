import type { Request, Response, NextFunction } from "express";

export const createCsrfProtection = (frontendOrigin: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }

    if (!req.path.startsWith("/auth/") && !req.path.startsWith("/analytics/")) {
      next();
      return;
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const secFetchSite = req.headers["sec-fetch-site"];

    if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site" && secFetchSite !== "none") {
      if (origin !== frontendOrigin) {
        res.status(403).json({ error: "Invalid origin" });
        return;
      }
      next();
      return;
    }

    if (origin) {
      if (origin !== frontendOrigin) {
        res.status(403).json({ error: "Invalid origin" });
        return;
      }
      next();
      return;
    }

    if (referer && !referer.startsWith(frontendOrigin + "/")) {
      res.status(403).json({ error: "Invalid origin" });
      return;
    }

    next();
  };
};
