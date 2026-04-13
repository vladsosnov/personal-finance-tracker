import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/lib/site-url";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/goals/", "/profile/", "/expenses/"],
    },
  ],
  sitemap: `${getSiteUrl()}/sitemap.xml`,
});

export default robots;
