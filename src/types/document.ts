export type DocType = "text" | "pdf" | "image";

export interface DocumentRow {
  id: string;
  title: string;
  size: number;
  chunkCount: number;
  date: number; // epoch ms
  type: DocType;
}

export interface ChunkRow {
  id: string;
  documentId: string;
  content: string;
  embedding: string; // JSON array
}