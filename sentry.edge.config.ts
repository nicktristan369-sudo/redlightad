import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
});
