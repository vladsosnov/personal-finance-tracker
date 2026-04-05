/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubPages ? '/personal-finance-tracker' : '';

const nextConfig = {
  ...(isGithubPages && {
    output: 'export',
    images: { unoptimized: true },
    assetPrefix: '/personal-finance-tracker/',
    trailingSlash: true,
  }),
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
