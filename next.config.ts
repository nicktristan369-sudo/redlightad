import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  
  // ── Production Optimizations ───────────────────────────────────────────────
  // Minify and obfuscate production builds (makes code harder to steal)
  productionBrowserSourceMaps: false, // Don't expose source maps in production
  
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
          // ── HTTPS Security ─────────────────────────────────────────────────
          // Force HTTPS — browsers will auto-redirect HTTP → HTTPS for 1 year
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          
          // ── Content Security Policy ────────────────────────────────────────
          // Strict CSP to prevent XSS attacks
          { 
            key: "Content-Security-Policy", 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://challenges.cloudflare.com https://*.livekit.cloud wss://*.livekit.cloud",
              "frame-src https://challenges.cloudflare.com https://*.stripe.com",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; ")
          },
          
          // ── Anti-Clickjacking ──────────────────────────────────────────────
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          
          // ── MIME Sniffing Protection ───────────────────────────────────────
          { key: "X-Content-Type-Options", value: "nosniff" },
          
          // ── XSS Protection (legacy browsers) ───────────────────────────────
          { key: "X-XSS-Protection", value: "1; mode=block" },
          
          // ── Referrer Policy ────────────────────────────────────────────────
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          
          // ── Permissions Policy ─────────────────────────────────────────────
          // Restrict browser features
          { 
            key: "Permissions-Policy", 
            value: "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()" 
          },
          
          // ── Cross-Origin Policies ──────────────────────────────────────────
          // Prevent embedding by other sites (protects content)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          
          // ── Cache Control for sensitive pages ──────────────────────────────
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      // ── Protect images from hotlinking ─────────────────────────────────────
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
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
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
};

export default nextConfig;
