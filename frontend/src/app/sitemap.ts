import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/lib/site-url";

const sitemap = (): MetadataRoute.Sitemap => {
  const baseUrl = getSiteUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
};

export default sitemap;
