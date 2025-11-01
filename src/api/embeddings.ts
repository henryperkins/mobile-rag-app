import { getSecureItem } from "../utils/secureStore";
import { getExpoExtraValue } from "../utils/expoConfig";

async function getKey() {
  const stored = await getSecureItem("OPENAI_API_KEY");
  if (stored) return stored;
  return getExpoExtraValue("OPENAI_API_KEY") ?? "";
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
