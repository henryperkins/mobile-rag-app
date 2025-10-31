import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { ChatMessage } from "../types/ai";

async function getKey() {
  return (await SecureStore.getItemAsync("OPENAI_API_KEY")) ??
    (Constants?.expoConfig?.extra as any)?.OPENAI_API_KEY ??
    "";
}

// Standard RAG chat
export async function chatWithRag(userText: string, contextChunks: string[]): Promise<string> {
  const key = await getKey();
  if (!key) throw new Error("OpenAI API key not set.");

  const system = `You are a helpful assistant. Use the supplied CONTEXT when relevant.
If information isn't in CONTEXT, say you don't know.
CONTEXT:
${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}`;

  const body = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userText }
    ],
    temperature: 0.2
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Chat failed: ${r.status} ${t}`);
  }
  const j = await r.json();
  return j.choices[0].message.content ?? "";
}

// Image OCR via GPT-4o Vision
export async function ocrImageBase64(base64JpegOrPng: string): Promise<string> {
  const key = await getKey();
  if (!key) throw new Error("OpenAI API key not set.");
  const body = {
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Extract and return the complete visible text from this image." },
        { type: "image_url", image_url: { url: `data:image/*;base64,${base64JpegOrPng}` } }
      ]
    }],
    temperature: 0
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`OCR failed: ${r.status} ${t}`);
  }
  const j = await r.json();
  return j.choices[0].message.content ?? "";
}