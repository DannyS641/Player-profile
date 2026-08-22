import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    // This is a small internal team app, not a public site — replays and
    // full tracing aren't worth the payload size, plain error capture is.
  });
}
