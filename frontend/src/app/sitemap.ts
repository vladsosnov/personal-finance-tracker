import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
};

export default sitemap;
