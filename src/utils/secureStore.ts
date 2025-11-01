import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const memory = new Map<string, string>();

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof window !== "undefined"
        ? window.localStorage?.getItem(key) ?? null
        : memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  }
  return typeof SecureStore.getItemAsync === "function"
    ? SecureStore.getItemAsync(key)
    : null;
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      window.localStorage?.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
    return;
  }
  if (typeof SecureStore.setItemAsync === "function") {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      window.localStorage?.removeItem(key);
    } catch {
      memory.delete(key);
    }
    return;
  }
  if (typeof SecureStore.deleteItemAsync === "function") {
    await SecureStore.deleteItemAsync(key);
  }
}