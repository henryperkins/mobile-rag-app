import * as SQLite from "expo-sqlite";
import { embedText } from "../api/embeddings";
import { cosine } from "./cosine";
import type { DocumentRow, DocType } from "../types/document";

const db = SQLite.openDatabaseSync("rag.db");

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
  clearEmbeddingCache(); // Clear cache after deletion
}

// Optional helper if you need document metadata on demand
export function getDocumentById(id: string): DocumentRow | undefined {
  const r = db.getFirstSync<DocumentRow>("SELECT * FROM documents WHERE id = ?", id);
  return r ?? undefined;
}

// Embedding cache to avoid repeated JSON.parse operations
const embeddingCache = new Map<string, number[]>();

function getCachedEmbedding(embeddingJson: string): number[] {
  if (embeddingCache.has(embeddingJson)) {
    return embeddingCache.get(embeddingJson)!;
  }
  const embedding = JSON.parse(embeddingJson) as number[];
  embeddingCache.set(embeddingJson, embedding);
  return embedding;
}

// Clear cache when database changes (call after document operations)
export function clearEmbeddingCache() {
  embeddingCache.clear();
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
) {
  const qEmbed = await embedText(query);

  let baseQuery = `
    SELECT chunks.id, chunks.content, chunks.embedding, chunks.documentId, documents.date
    FROM chunks
    JOIN documents ON documents.id = chunks.documentId
  `;
  const params: any[] = [];
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

  if (conditions.length > 0) {
    baseQuery += " WHERE " + conditions.join(" AND ");
  }

  // Add ORDER BY documents.date DESC for more recent-first processing
  baseQuery += " ORDER BY documents.date DESC";

  let rows: any[];
  if (opts?.maxChunks) {
    rows = db.getAllSync<any>(baseQuery + " LIMIT ?", ...params, opts.maxChunks);
  } else {
    rows = db.getAllSync<any>(baseQuery, ...params);
  }

  const scored = rows.map((r) => {
    const emb = getCachedEmbedding(r.embedding);
    return { ...r, score: cosine(qEmbed, emb) };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

export function chunksForDocument(documentId: string) {
  return db.getAllSync<any>("SELECT * FROM chunks WHERE documentId = ? ORDER BY rowid ASC", documentId);
}
