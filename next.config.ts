import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  async redirects() {
    return [
      { source: '/opret-annonce', destination: '/create-profile', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Force HTTPS — browsers will auto-redirect HTTP → HTTPS for 1 year
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Block mixed content (HTTP resources on HTTPS page)
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
          // Extra security
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
