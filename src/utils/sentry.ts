import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

let initialized = false;

export function initSentry() {
  const dsn = (Constants?.expoConfig?.extra as any)?.SENTRY_DSN || "";
  if (!dsn || initialized) return;
  Sentry.init({
    dsn,
    enableAutoPerformanceTracking: true,
    tracesSampleRate: 0.2
  });
  initialized = true;
}

export function reportError(err: unknown, context?: Record<string, any>) {
  try {
    if (!initialized) return;
    Sentry.captureException(err, scope => {
      if (context) scope.setContext("context", context);
    });
  } catch { /* no-op */ }
}