import * as SQLite from "expo-sqlite";
import { embedText } from "../api/embeddings";
import { cosine } from "./cosine";
import type { DocumentRow, DocType, ChunkRow } from "../types/document";

const db = SQLite.openDatabaseSync("rag.db");

interface DocIndexRow {
  id: string;
  centroid: string;
  date: number;
}

interface ChunkRowWithDate extends ChunkRow {
  date: number;
}

export interface RankedChunk extends ChunkRowWithDate {
  score: number;
}

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      size INTEGER,
      chunkCount INTEGER,
      date INTEGER,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      documentId TEXT,
      content TEXT,
      embedding TEXT,
      FOREIGN KEY(documentId) REFERENCES documents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_documentId ON chunks(documentId);

    -- New: per-document centroid index for two-stage retrieval
    CREATE TABLE IF NOT EXISTS doc_index (
      documentId TEXT PRIMARY KEY,
      centroid TEXT,
      chunkCount INTEGER,
      FOREIGN KEY(documentId) REFERENCES documents(id)
    );

    -- Helpful for filtering + ordering
    CREATE INDEX IF NOT EXISTS idx_documents_type_date ON documents(type, date);
  `);
}

export function insertDocument(doc: DocumentRow) {
  db.runSync(
    "INSERT OR REPLACE INTO documents (id,title,size,chunkCount,date,type) VALUES (?,?,?,?,?,?)",
    doc.id, doc.title, doc.size, doc.chunkCount, doc.date, doc.type
  );
}

export function updateDocumentChunkCount(id: string, chunkCount: number) {
  db.runSync("UPDATE documents SET chunkCount = ? WHERE id = ?", chunkCount, id);
}

export function insertChunk(id: string, documentId: string, content: string, embedding: number[]) {
  db.runSync(
    "INSERT OR REPLACE INTO chunks (id, documentId, content, embedding) VALUES (?,?,?,?)",
    id, documentId, content, JSON.stringify(embedding)
  );
}

export function listDocuments(): DocumentRow[] {
  return db.getAllSync<DocumentRow>("SELECT * FROM documents ORDER BY date DESC");
}

export function deleteDocument(documentId: string) {
  db.runSync("DELETE FROM chunks WHERE documentId = ?", documentId);
  db.runSync("DELETE FROM documents WHERE id = ?", documentId);
  deleteDocCentroid(documentId);
  clearEmbeddingCache();
  clearCentroidCache();
}

// Optional helper if you need document metadata on demand
export function getDocumentById(id: string): DocumentRow | undefined {
  const r = db.getFirstSync<DocumentRow>("SELECT * FROM documents WHERE id = ?", id);
  return r ?? undefined;
}

// Embedding cache to avoid repeated JSON.parse operations
const MAX_CACHE_SIZE = 1000;
const embeddingCache = new Map<string, number[]>();
const centroidCache = new Map<string, number[]>();

function manageCacheSize<T>(cache: Map<string, T>) {
  if (cache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first 20% to maintain performance)
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const keys = Array.from(cache.keys()).slice(0, entriesToRemove);
    keys.forEach(key => cache.delete(key));
  }
}

function getCachedEmbedding(embeddingJson: string): number[] {
  const cached = embeddingCache.get(embeddingJson);
  if (cached) return cached;

  const embedding = JSON.parse(embeddingJson) as number[];
  embeddingCache.set(embeddingJson, embedding);
  manageCacheSize(embeddingCache);
  return embedding;
}

function getCachedCentroid(centroidJson: string): number[] {
  const cached = centroidCache.get(centroidJson);
  if (cached) return cached;

  const centroid = JSON.parse(centroidJson) as number[];
  centroidCache.set(centroidJson, centroid);
  manageCacheSize(centroidCache);
  return centroid;
}

// Clear caches when database changes
export function clearEmbeddingCache() {
  embeddingCache.clear();
}
function clearCentroidCache() {
  centroidCache.clear();
}

// New: maintain per-document centroid
export function upsertDocCentroid(documentId: string, centroid: number[], chunkCount: number) {
  db.runSync(
    "INSERT OR REPLACE INTO doc_index (documentId, centroid, chunkCount) VALUES (?,?,?)",
    documentId, JSON.stringify(centroid), chunkCount
  );
}

export function deleteDocCentroid(documentId: string) {
  db.runSync("DELETE FROM doc_index WHERE documentId = ?", documentId);
}

// Optional: one-time rebuild for existing libraries
export function rebuildDocIndex() {
  const docs = db.getAllSync<{ id: string; chunkCount: number }>("SELECT id, chunkCount FROM documents");
  for (const d of docs) {
    const rows = db.getAllSync<{ embedding: string }>("SELECT embedding FROM chunks WHERE documentId = ?", d.id);
    if (!rows.length) continue;
    let sum: number[] | null = null;
    for (const r of rows) {
      const e = getCachedEmbedding(r.embedding);
      if (!sum) sum = new Array(e.length).fill(0);
      for (let i = 0; i < e.length; i++) sum[i] += e[i];
    }
    if (sum) {
      const count = rows.length;
      const centroid = sum.map(v => v / count);
      upsertDocCentroid(d.id, centroid, count);
    }
  }
  clearCentroidCache();
}

// Pure helper for tests
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

// Top-k search with optional document-type filter and performance optimizations
export async function retrieveTopK(
  query: string,
  k = 3,
  opts?: {
    docType?: DocType;
    maxChunks?: number; // Limit total chunks to process for large libraries
    dateRange?: { start?: number; end?: number }; // Filter by document date
  }
) : Promise<RankedChunk[]> {
  const qEmbed = await embedText(query);

  // Try two-stage retrieval using doc_index
  let docQuery = `
    SELECT doc_index.documentId AS id, doc_index.centroid, documents.date
    FROM doc_index
    JOIN documents ON documents.id = doc_index.documentId
  `;
  const docParams: unknown[] = [];
  const docConds: string[] = [];

  if (opts?.docType) {
    docConds.push("documents.type = ?");
    docParams.push(opts.docType);
  }
  if (opts?.dateRange?.start) {
    docConds.push("documents.date >= ?");
    docParams.push(opts.dateRange.start);
  }
  if (opts?.dateRange?.end) {
    docConds.push("documents.date <= ?");
    docParams.push(opts.dateRange.end);
  }
  if (docConds.length) docQuery += " WHERE " + docConds.join(" AND ");
  docQuery += " ORDER BY documents.date DESC";

  const docRows = db.getAllSync<DocIndexRow>(docQuery, ...docParams);

  // If we have centroids, shortlist documents first
  if (docRows.length > 0) {
    const docScores = docRows.map((r) => ({
      documentId: r.id,
      score: cosine(qEmbed, getCachedCentroid(r.centroid))
    })).sort((a, b) => b.score - a.score);

    const shortlistSize = Math.max(10, k * 5);
    const shortlisted = docScores.slice(0, shortlistSize).map((d) => d.documentId);
    if (shortlisted.length === 0) return [];

    // Now score chunks only within shortlisted documents
    let baseQuery = `
      SELECT chunks.id, chunks.content, chunks.embedding, chunks.documentId, documents.date
      FROM chunks
      JOIN documents ON documents.id = chunks.documentId
      WHERE chunks.documentId IN (${shortlisted.map(() => "?").join(",")})
    `;
    const params: unknown[] = [...shortlisted];
    const conditions: string[] = [];

    if (opts?.docType) {
      conditions.push("documents.type = ?");
      params.push(opts.docType);
    }
    if (opts?.dateRange?.start) {
      conditions.push("documents.date >= ?");
      params.push(opts.dateRange.start);
    }
    if (opts?.dateRange?.end) {
      conditions.push("documents.date <= ?");
      params.push(opts.dateRange.end);
    }
    if (conditions.length) baseQuery += " AND " + conditions.join(" AND ");
    baseQuery += " ORDER BY documents.date DESC";

    let rows: ChunkRowWithDate[];
    if (opts?.maxChunks) {
      rows = db.getAllSync<ChunkRowWithDate>(baseQuery + " LIMIT ?", ...params, opts.maxChunks);
    } else {
      rows = db.getAllSync<ChunkRowWithDate>(baseQuery, ...params);
    }

    const scored = rows.map<RankedChunk>((r) => {
      const emb = getCachedEmbedding(r.embedding);
      return { ...r, score: cosine(qEmbed, emb) };
    }).sort((a, b) => b.score - a.score);

    return scored.slice(0, k);
  }

  // Fallback: single-stage across all chunks (older libraries without doc_index)
  let baseQuery = `
    SELECT chunks.id, chunks.content, chunks.embedding, chunks.documentId, documents.date
    FROM chunks
    JOIN documents ON documents.id = chunks.documentId
  `;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (opts?.docType) {
    conditions.push("documents.type = ?");
    params.push(opts.docType);
  }
  if (opts?.dateRange?.start) {
    conditions.push("documents.date >= ?");
    params.push(opts.dateRange.start);
  }
  if (opts?.dateRange?.end) {
    conditions.push("documents.date <= ?");
    params.push(opts.dateRange.end);
  }
  if (conditions.length) baseQuery += " WHERE " + conditions.join(" AND ");
  baseQuery += " ORDER BY documents.date DESC";

  let rows: ChunkRowWithDate[];
  if (opts?.maxChunks) {
    rows = db.getAllSync<ChunkRowWithDate>(baseQuery + " LIMIT ?", ...params, opts.maxChunks);
  } else {
    rows = db.getAllSync<ChunkRowWithDate>(baseQuery, ...params);
  }

  const scored = rows.map<RankedChunk>((r) => {
    const emb = getCachedEmbedding(r.embedding);
    return { ...r, score: cosine(qEmbed, emb) };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

export function chunksForDocument(documentId: string): ChunkRow[] {
  return db.getAllSync<ChunkRow>("SELECT * FROM chunks WHERE documentId = ? ORDER BY rowid ASC", documentId);
}
