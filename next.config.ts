import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  async redirects() {
    return [
      { source: '/opret-annonce', destination: '/create-profile', permanent: true },
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
