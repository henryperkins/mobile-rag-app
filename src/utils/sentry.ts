import * as Sentry from "@sentry/react-native";
import { getExpoExtraValue } from "./expoConfig";

let initialized = false;

export function initSentry() {
  const rawDsn = getExpoExtraValue("SENTRY_DSN");
  const dsn = typeof rawDsn === "string" ? rawDsn.trim() : "";
  const isPlaceholder = dsn.includes("YOUR_SENTRY_DSN_HERE");
  if (!dsn || isPlaceholder) {
    if (__DEV__ && !initialized) {
      console.info("Sentry disabled: no DSN configured.");
    }
    return;
  }
  if (initialized) return;

  Sentry.init({
    dsn,
    enableAutoPerformanceTracking: true,
    tracesSampleRate: 0.2
  });
  initialized = true;
}

export function reportError(err: unknown, context?: Record<string, unknown>) {
  try {
    if (!initialized) return;
    Sentry.captureException(err, scope => {
      if (context) scope.setContext("context", context);
    });
  } catch { /* no-op */ }
}
