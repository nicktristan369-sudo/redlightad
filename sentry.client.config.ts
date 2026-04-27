import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  environment: process.env.NODE_ENV,
});
