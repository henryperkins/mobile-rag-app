import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { toByteArray } from "base64-js";
import { ocrImageBase64 } from "../api/chat-service";
import { embedText } from "../api/embeddings";
import { insertChunk, insertDocument, updateDocumentChunkCount, clearEmbeddingCache } from "./vectorDb";
import { randomUUID } from "./uuid";

const EMBEDDING_DELAY_MS = 150; // base pacing between calls
const MAX_RETRIES = 4;

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function embedWithBackoff(text: string) {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= MAX_RETRIES) {
    try {
      const emb = await embedText(text);
      // light pacing between successful calls
      await sleep(EMBEDDING_DELAY_MS);
      return emb;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? "");
      const status = Number(/\b([45]\d{2})\b/.exec(msg)?.[1] ?? 0);
      const isRate = status === 429 || /rate limit/i.test(msg);
      const isServer = status >= 500 && status < 600;
      if (!(isRate || isServer) || attempt === MAX_RETRIES) break;
      const backoff = Math.min(1500, 200 * Math.pow(2, attempt)); // 200ms, 400ms, 800ms, 1600ms
      await sleep(backoff + Math.random() * 120);
      attempt++;
    }
  }
  throw lastErr ?? new Error("Embedding failed");
}

export async function pickAnyDocument() {
  // Offer docs first; you can add a UI choice for images separately
  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/pdf", "text/plain", "text/markdown", "text/*"]
  });
  if (res.canceled || !res.assets?.length) throw new Error("No document selected.");
  return res.assets[0]; // { uri, name, size, mimeType }
}

export async function pickImageForOcr() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") throw new Error("Permission denied");
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    base64: false
  });
  if (res.canceled || !res.assets?.length) throw new Error("No image selected.");
  return res.assets[0]; // { uri, fileName, fileSize, ... }
}

export async function processTextFile(uri: string): Promise<string> {
  const txt = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  return txt;
}

export async function processImageFileToText(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return ocrImageBase64(base64);
}

// --- PDF text extraction via pdf.js (works in RN with minimal shims) ---
async function loadPdf() {
  // Use legacy build for broader compatibility
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
  // @ts-ignore silence types for worker
  pdfjs.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/legacy/build/pdf.worker.entry");
  return pdfjs;
}

export async function processPdfToText(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = toByteArray(base64);
  const pdfjs = await loadPdf();
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const out: string[] = [];
  const pages = Math.min(doc.numPages, 50); // safety cap
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out.push(content.items.map((i: any) => i.str).join(" "));
  }
  return out.join("\n\n");
}

// Sentence-aware chunking for better coherence
export function chunkText(input: string, targetSize = 500, overlap = 50) {
  // Split text into sentences using common sentence terminators
  const sentences = input.match(/[^.!?]+[.!?]+[\s"')\]}]*|[^.!?]+$/g) || [input];

  const chunks: string[] = [];
  let currentChunk = "";
  let currentIndex = 0;

  while (currentIndex < sentences.length) {
    const sentence = sentences[currentIndex].trim();
    const testChunk = currentChunk + (currentChunk ? " " : "") + sentence;

    // If adding this sentence doesn't exceed target size significantly, add it
    if (testChunk.length <= targetSize * 1.2) { // Allow 20% overflow for sentence completeness
      currentChunk = testChunk;
      currentIndex++;
    } else {
      // If current chunk is substantial, save it and start a new one
      if (currentChunk.length >= targetSize * 0.6) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      } else {
        // For very short chunks, force add the sentence to avoid tiny chunks
        currentChunk = testChunk;
        currentIndex++;
      }
    }

    // If we've reached the target size and have more content, start new chunk
    if (currentChunk.length >= targetSize && currentIndex < sentences.length) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle overlap by merging content between adjacent chunks
  if (overlap > 0 && chunks.length > 1) {
    const overlappedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];

      // Add overlap from previous chunk
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const words = prevChunk.split(/\s+/);
        const overlapWords = Math.min(overlap, words.length);
        const overlapText = words.slice(-overlapWords).join(" ");
        chunk = overlapText + " " + chunk;
      }

      overlappedChunks.push(chunk);
    }

    return overlappedChunks;
  }

  // If no overlap or single chunk, return as-is
  return chunks.length > 0 ? chunks : [input];
}

// Full pipeline: produce embeddings & persist
export async function ingestDocument(params: {
  title: string;
  type: "text" | "pdf" | "image";
  uri: string;
  size: number;
}) {
  const { title, type, uri, size } = params;
  let text = "";
  if (type === "text") text = await processTextFile(uri);
  else if (type === "image") text = await processImageFileToText(uri);
  else text = await processPdfToText(uri);

  if (!text.trim()) throw new Error("No text extracted from file.");

  const chunks = chunkText(text, 500, 50);
  const docId = randomUUID();
  const now = Date.now();

  // Insert doc row first (chunkCount filled later)
  insertDocument({ id: docId, title, size, chunkCount: 0, date: now, type });

  // Embed with rate limiting and backoff
  let count = 0;
  for (const c of chunks) {
    const embedding = await embedWithBackoff(c);
    insertChunk(randomUUID(), docId, c, embedding);
    count++;
  }

  updateDocumentChunkCount(docId, count);
  clearEmbeddingCache(); // Clear cache after adding new document
  return { id: docId, chunkCount: count };
}
