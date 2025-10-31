import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

async function getKey() {
  return (await SecureStore.getItemAsync("OPENAI_API_KEY")) ??
    (Constants?.expoConfig?.extra as any)?.OPENAI_API_KEY ??
    "";
}

export async function embedText(input: string): Promise<number[]> {
  const key = await getKey();
  if (!key) throw new Error("OpenAI API key not set.");
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Embedding failed: ${r.status} ${t}`);
  }
  const j = await r.json();
  return j.data[0].embedding as number[];
}