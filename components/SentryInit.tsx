"use client";

import { useEffect } from "react";

export default function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    // Dynamically import Sentry to avoid SSR issues
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
      });
    }).catch(() => {
      // Sentry unavailable, continue without it
    });
  }, []);

  return null;
}
