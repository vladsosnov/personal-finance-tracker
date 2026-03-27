/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/personal-finance-tracker' : '',

  // Asset prefix for GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? '/personal-finance-tracker/' : '',

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },

  // Disable server-side features for static export
  reactStrictMode: true,
};

module.exports = nextConfig;
