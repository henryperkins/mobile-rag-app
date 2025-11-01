// src/utils/vectorDb.web.ts
import { embedText } from "../api/embeddings";
import { cosine } from "./cosine";
import type { DocumentRow, DocType, ChunkRow } from "../types/document";

type ChunkEntry = {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  embeddingJson: string;
  createdAt: number;
};

type DateRange = { start?: number; end?: number };

const documents = new Map<string, DocumentRow>();
const chunks = new Map<string, ChunkEntry>();
const docIndex = new Map<string, { centroid: number[]; chunkCount: number }>();

function cloneDocument(doc: DocumentRow): DocumentRow {
  return { ...doc };
}

function passesDocFilters(doc: DocumentRow, opts?: { docType?: DocType; dateRange?: DateRange }) {
  if (opts?.docType && doc.type !== opts.docType) return false;
  if (opts?.dateRange?.start && doc.date < opts.dateRange.start) return false;
  if (opts?.dateRange?.end && doc.date > opts.dateRange.end) return false;
  return true;
}

interface ChunkRowWithDate extends ChunkRow {
  date: number;
}

export interface RankedChunk extends ChunkRowWithDate {
  score: number;
}

export function initDb(): void {
  // web uses in-memory storage; nothing to initialize
}

export function insertDocument(doc: DocumentRow): void {
  documents.set(doc.id, cloneDocument(doc));
}

export function updateDocumentChunkCount(id: string, chunkCount: number): void {
  const doc = documents.get(id);
  if (doc) documents.set(id, { ...doc, chunkCount });
}

export function insertChunk(id: string, documentId: string, content: string, embedding: number[]): void {
  chunks.set(id, {
    id,
    documentId,
    content,
    embedding: [...embedding],
    embeddingJson: JSON.stringify(embedding),
    createdAt: Date.now()
  });
}

export function listDocuments(): DocumentRow[] {
  return Array.from(documents.values()).sort((a, b) => b.date - a.date);
}

export function deleteDocument(documentId: string): void {
  documents.delete(documentId);
  for (const key of Array.from(chunks.keys())) {
    if (chunks.get(key)?.documentId === documentId) chunks.delete(key);
  }
  deleteDocCentroid(documentId);
  clearEmbeddingCache();
}

export function getDocumentById(id: string): DocumentRow | undefined {
  const doc = documents.get(id);
  return doc ? { ...doc } : undefined;
}

export function clearEmbeddingCache(): void {
  // no cached data to clear in the web shim
}

export function upsertDocCentroid(documentId: string, centroid: number[], chunkCount: number): void {
  docIndex.set(documentId, { centroid: [...centroid], chunkCount });
}

export function deleteDocCentroid(documentId: string): void {
  docIndex.delete(documentId);
}

export function rebuildDocIndex(): void {
  docIndex.clear();
  for (const doc of documents.values()) {
    const docChunks = Array.from(chunks.values()).filter(c => c.documentId === doc.id);
    if (!docChunks.length) continue;
    const dim = docChunks[0].embedding.length;
    const sum = new Array(dim).fill(0);
    for (const chunk of docChunks) {
      for (let i = 0; i < dim; i++) sum[i] += chunk.embedding[i];
    }
    const centroid = sum.map(v => v / docChunks.length);
    docIndex.set(doc.id, { centroid, chunkCount: docChunks.length });
  }
}

export function rankByCosine(
  queryEmbedding: number[],
  rows: { id: string; embedding: number[] }[],
  k = 3
) {
  return rows
    .map(r => ({ ...r, score: cosine(queryEmbedding, r.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function retrieveTopK(
  query: string,
  k = 3,
  opts?: {
    docType?: DocType;
    maxChunks?: number;
    dateRange?: DateRange;
  }
): Promise<RankedChunk[]> {
  const queryEmbedding = await embedText(query);
  const candidateDocs = Array.from(documents.values()).filter(doc => passesDocFilters(doc, opts));
  if (!candidateDocs.length) return [];

  let shortlistedIds: Set<string> | null = null;

  if (docIndex.size) {
    const docScores = candidateDocs
      .map(doc => {
        const idx = docIndex.get(doc.id);
        if (!idx) return null;
        return { documentId: doc.id, score: cosine(queryEmbedding, idx.centroid) };
      })
      .filter((item): item is { documentId: string; score: number } => item !== null)
      .sort((a, b) => b.score - a.score);

    if (docScores.length) {
      const shortlistSize = Math.max(10, k * 5);
      shortlistedIds = new Set(docScores.slice(0, shortlistSize).map(d => d.documentId));
    }
  }

  const eligibleDocIds = new Set(candidateDocs.map(doc => doc.id));
  const chunkPool: Array<{
    id: string;
    documentId: string;
    content: string;
    embeddingJson: string;
    embeddingArray: number[];
    date: number;
  }> = [];

  for (const chunk of chunks.values()) {
    if (!eligibleDocIds.has(chunk.documentId)) continue;
    if (shortlistedIds && !shortlistedIds.has(chunk.documentId)) continue;

    const doc = documents.get(chunk.documentId);
    if (!doc) continue;

    chunkPool.push({
      id: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      embeddingJson: chunk.embeddingJson,
      embeddingArray: chunk.embedding,
      date: doc.date
    });

    if (opts?.maxChunks && chunkPool.length >= opts.maxChunks) break;
  }

  const scored = chunkPool
    .map<RankedChunk>(row => ({
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      embedding: row.embeddingJson,
      date: row.date,
      score: cosine(queryEmbedding, row.embeddingArray)
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

export function chunksForDocument(documentId: string): ChunkRow[] {
  return Array.from(chunks.values())
    .filter(chunk => chunk.documentId === documentId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map<ChunkRow>(chunk => ({
      id: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      embedding: chunk.embeddingJson
    }));
}
