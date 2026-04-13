const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const getSiteUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return trimTrailingSlash(explicit);
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) {
    return trimTrailingSlash(`https://${vercelUrl}`);
  }

  return "http://localhost:3000";
};

