import Constants from "expo-constants";

export interface RagExpoExtra {
  OPENAI_API_KEY?: string;
  SENTRY_DSN?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(extra: Record<string, unknown>, key: keyof RagExpoExtra) {
  const value = extra[key];
  return typeof value === "string" ? value : undefined;
}

export function getExpoExtra(): RagExpoExtra {
  const rawExtra = Constants?.expoConfig?.extra;
  if (!isRecord(rawExtra)) return {};
  return {
    OPENAI_API_KEY: readString(rawExtra, "OPENAI_API_KEY"),
    SENTRY_DSN: readString(rawExtra, "SENTRY_DSN")
  };
}

export function getExpoExtraValue<K extends keyof RagExpoExtra>(key: K): RagExpoExtra[K] | undefined {
  return getExpoExtra()[key];
}
