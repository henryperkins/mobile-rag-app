import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { toByteArray } from "base64-js";
import { ocrImageBase64 } from "../api/chat-service";
import { embedText } from "../api/embeddings";
import { insertChunk, insertDocument, updateDocumentChunkCount, clearEmbeddingCache, upsertDocCentroid } from "./vectorDb";
import { randomUUID } from "./uuid";
import type { DocumentPickerAsset } from "expo-document-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { loadPdf } from "./pdfLoader";

const EMBEDDING_DELAY_MS = 150; // base pacing between calls
const MAX_RETRIES = 4;

// Security constraints
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
const MAX_TEXT_LENGTH = 10 * 1024 * 1024; // 10MB text processing limit
const ALLOWED_MIME_TYPES = {
  text: ["text/plain", "text/markdown", "text/*"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"]
};

type SupportedAsset = DocumentPickerAsset | ImagePickerAsset;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAssetSize(asset: SupportedAsset): number | undefined {
  if ("size" in asset && typeof asset.size === "number") return asset.size;
  if ("fileSize" in asset && typeof asset.fileSize === "number") return asset.fileSize;
  return undefined;
}

function getAssetMimeType(asset: SupportedAsset): string | undefined {
  if ("mimeType" in asset && typeof asset.mimeType === "string") return asset.mimeType;
  return undefined;
}

function getAssetType(asset: SupportedAsset): string | undefined {
  if ("type" in asset && typeof asset.type === "string") return asset.type;
  return undefined;
}

function validateFileAsset(asset: SupportedAsset | null | undefined, expectedType: "text" | "pdf" | "image") {
  if (!asset) throw new Error("No file selected");

  const size = getAssetSize(asset);
  if (typeof size === "number" && size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  const mimeType = getAssetMimeType(asset);
  if (mimeType) {
    const allowedTypes = ALLOWED_MIME_TYPES[expectedType];
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith("/*")) {
        return mimeType.startsWith(type.slice(0, -1));
      }
      return mimeType === type;
    });
    if (!isAllowed) {
      throw new Error(`Invalid file type. Expected ${expectedType} file`);
    }
    return;
  }

  // Fallback for assets without explicit MIME type (e.g., image picker)
  const assetType = getAssetType(asset);
  if (expectedType === "image" && assetType === "image") return;
  // If MIME information is unavailable, allow text/pdf assets through to avoid false negatives.
  if (expectedType !== "image") return;
  throw new Error("Unable to determine file type.");
}

function validateTextLength(text: string) {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text too long. Maximum length is ${MAX_TEXT_LENGTH / (1024 * 1024)}MB`);
  }
}

async function embedWithBackoff(text: string) {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= MAX_RETRIES) {
    try {
      const emb = await embedText(text);
      // light pacing between successful calls
      await sleep(EMBEDDING_DELAY_MS);
      return emb;
    } catch (err: unknown) {
      lastErr = err;
      const message = err instanceof Error ? err.message : "";
      const msg = String(message);
      const status = Number(/\b([45]\d{2})\b/.exec(msg)?.[1] ?? 0);
      const isRate = status === 429 || /rate limit/i.test(msg);
      const isServer = status >= 500 && status < 600;
      if (!(isRate || isServer) || attempt === MAX_RETRIES) break;
      const backoff = Math.min(1500, 200 * Math.pow(2, attempt)); // 200ms, 400ms, 800ms, 1600ms
      await sleep(backoff + Math.random() * 120);
      attempt++;
    }
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error("Embedding failed");
}

export async function pickAnyDocument(): Promise<DocumentPickerAsset> {
  // Offer docs first; you can add a UI choice for images separately
  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/pdf", "text/plain", "text/markdown", "text/*"]
  });
  if (res.canceled || !res.assets?.length) throw new Error("No document selected.");

  const asset = res.assets[0];

  // Validate based on MIME type
  if (asset.mimeType === "application/pdf") {
    validateFileAsset(asset, "pdf");
  } else {
    validateFileAsset(asset, "text");
  }

  return asset; // { uri, name, size, mimeType }
}

export async function pickImageForOcr(): Promise<ImagePickerAsset> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") throw new Error("Permission denied");
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    base64: false
  });
  if (res.canceled || !res.assets?.length) throw new Error("No image selected.");

  const asset = res.assets[0];
  validateFileAsset(asset, "image");

  return asset; // { uri, fileName, fileSize, ... }
}

export async function processTextFile(uri: string): Promise<string> {
  const txt = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  validateTextLength(txt);
  return txt;
}

export async function processImageFileToText(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const text = await ocrImageBase64(base64);
  validateTextLength(text);
  return text;
}

// --- PDF text extraction via pdf.js (works in RN with minimal shims) ---
function isTextItem(item: unknown): item is TextItem {
  return typeof item === "object" && item !== null && "str" in item && typeof (item as { str?: unknown }).str === "string";
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
    const textItems = content.items.filter(isTextItem);
    out.push(textItems.map((item) => item.str).join(" "));
  }
  const text = out.join("\n\n");
  validateTextLength(text);
  return text;
}

// Character-based chunking to match tests/README (500 chars, 50-char overlap)
export function chunkText(input: string, targetSize = 500, overlap = 50) {
  if (!input) return [""];
  if (targetSize <= 0) return [input];

  // Ensure overlap is sane
  overlap = Math.max(0, Math.min(overlap, targetSize - 1));

  if (input.length <= targetSize) return [input];

  const chunks: string[] = [];
  const step = targetSize - overlap;

  for (let start = 0; start < input.length; start += step) {
    chunks.push(input.slice(start, start + targetSize));
  }
  return chunks;
}

// (Optional) Sentence-aware chunking for better coherence - kept for future use
export function chunkTextSentenceAware(input: string, targetSize = 500, overlap = 50) {
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

  // Handle word-based overlap by merging content between adjacent chunks
  // Note: The overlap parameter refers to number of words (not characters)
  if (overlap > 0 && chunks.length > 1) {
    const overlappedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];

      // Add word overlap from previous chunk
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
  let sum: number[] | null = null;

  for (const c of chunks) {
    const embedding = await embedWithBackoff(c);
    insertChunk(randomUUID(), docId, c, embedding);
    if (!sum) sum = new Array(embedding.length).fill(0);
    for (let i = 0; i < embedding.length; i++) sum[i] += embedding[i];
    count++;
  }

  updateDocumentChunkCount(docId, count);

  if (sum && count > 0) {
    const centroid = sum.map(v => v / count);
    upsertDocCentroid(docId, centroid, count);
  }

  clearEmbeddingCache(); // Clear cache after adding new document
  return { id: docId, chunkCount: count };
}
