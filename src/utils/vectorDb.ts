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
}

// Optional helper if you need document metadata on demand
export function getDocumentById(id: string): DocumentRow | undefined {
  const r = db.getFirstSync<DocumentRow>("SELECT * FROM documents WHERE id = ?", id);
  return r ?? undefined;
}

// Top-k search with optional document-type filter
export async function retrieveTopK(
  query: string,
  k = 3,
  opts?: { docType?: DocType }
) {
  const qEmbed = await embedText(query);

  let rows: any[];
  if (opts?.docType) {
    rows = db.getAllSync<any>(
      `SELECT chunks.id, chunks.content, chunks.embedding, chunks.documentId
       FROM chunks
       JOIN documents ON documents.id = chunks.documentId
       WHERE documents.type = ?`,
      opts.docType
    );
  } else {
    rows = db.getAllSync<any>(
      "SELECT id, content, embedding, documentId FROM chunks"
    );
  }

  const scored = rows.map((r) => {
    const emb = JSON.parse(r.embedding) as number[];
    return { ...r, score: cosine(qEmbed, emb) };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

export function chunksForDocument(documentId: string) {
  return db.getAllSync<any>("SELECT * FROM chunks WHERE documentId = ?", documentId);
}