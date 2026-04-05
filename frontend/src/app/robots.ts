import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/goals/", "/profile/", "/expenses/"],
    },
  ],
  sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000"}/sitemap.xml`,
});

export default robots;
