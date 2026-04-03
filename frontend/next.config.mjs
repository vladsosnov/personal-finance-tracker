/** @type {import('next').NextConfig} */
const basePath = process.env.NODE_ENV === 'production' ? '/personal-finance-tracker' : '';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: process.env.NODE_ENV === 'production' ? '/personal-finance-tracker/' : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
