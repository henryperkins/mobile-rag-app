type Row = Record<string, any>;

let globalDbInstance: MockDatabase | null = null;

class MockDatabase {
  private data: Record<string, Row[]> = {
    documents: [],
    chunks: [],
    doc_index: [],
  };

  constructor() {
    globalDbInstance = this;
  }

  execSync(): void {
    // noop - schema initialization
  }

  runSync(sql: string, ...params: any[]): void {
    // Handle INSERT and UPDATE operations
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("insert") || lowerSql.includes("replace")) {
      // Handle INSERT OR REPLACE
      if (lowerSql.includes("documents")) {
        const doc = {
          id: params[0],
          title: params[1],
          size: params[2],
          chunkCount: params[3],
          date: params[4],
          type: params[5],
        };

        // Replace existing document with same ID
        this.data.documents = this.data.documents.filter(d => d.id !== doc.id);
        this.data.documents.push(doc);
      } else if (lowerSql.includes("chunks")) {
        const chunk = {
          id: params[0],
          documentId: params[1],
          content: params[2],
          embedding: params[3],
        };

        // Replace existing chunk with same ID
        this.data.chunks = this.data.chunks.filter(c => c.id !== chunk.id);
        this.data.chunks.push(chunk);
      } else if (lowerSql.includes("doc_index")) {
        const docIndex = {
          documentId: params[0],
          centroid: params[1],
          chunkCount: params[2],
        };

        // Replace existing doc_index entry with same documentId
        this.data.doc_index = this.data.doc_index.filter(d => d.documentId !== docIndex.documentId);
        this.data.doc_index.push(docIndex);
      }
    } else if (lowerSql.includes("update")) {
      // Handle UPDATE operations
      if (lowerSql.includes("chunkcount")) {
        const chunkCount = params[0];
        const docId = params[1];

        const doc = this.data.documents.find(d => d.id === docId);
        if (doc) {
          doc.chunkCount = chunkCount;
        }
      }
    } else if (lowerSql.includes("delete")) {
      // Handle DELETE operations
      if (lowerSql.includes("chunks where documentid")) {
        const docId = params[0];
        this.data.chunks = this.data.chunks.filter(c => c.documentId !== docId);
      } else if (lowerSql.includes("documents where id")) {
        const docId = params[0];
        this.data.documents = this.data.documents.filter(d => d.id !== docId);
      } else if (lowerSql.includes("doc_index where documentid")) {
        const docId = params[0];
        this.data.doc_index = this.data.doc_index.filter(d => d.documentId !== docId);
      }
    }
  }

  getAllSync<T = Row>(sql: string, ...params: any[]): T[] {
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("select * from documents")) {
      return this.data.documents.slice().sort((a, b) => b.date - a.date) as T[];
    } else if (lowerSql.includes("select * from chunks where documentid")) {
      const docId = params[0];
      return this.data.chunks.filter(c => c.documentId === docId) as T[];
    } else if (lowerSql.includes("select chunks.id") &&
               lowerSql.includes("chunks.content") &&
               lowerSql.includes("chunks.embedding") &&
               lowerSql.includes("chunks.documentid") &&
               lowerSql.includes("documents.date") &&
               lowerSql.includes("from chunks") &&
               lowerSql.includes("join documents")) {

      
      let results = this.data.chunks.map(chunk => {
        const doc = this.data.documents.find(d => d.id === chunk.documentId);
        return {
          id: chunk.id,
          content: chunk.content,
          embedding: chunk.embedding,
          documentId: chunk.documentId,
          date: doc?.date || 0,
        };
      });

      // Apply filters from WHERE clause
      const docTypeMatch = lowerSql.includes("documents.type = ?");
      const dateStartMatch = lowerSql.includes("documents.date >= ?");
      const dateEndMatch = lowerSql.includes("documents.date <= ?");

      let paramIndex = 0;

      if (docTypeMatch && params[paramIndex]) {
        const docType = params[paramIndex++];
        results = results.filter(r => {
          const doc = this.data.documents.find(d => d.id === r.documentId);
          return doc?.type === docType;
        });
      }

      if (dateStartMatch && params[paramIndex]) {
        const startDate = params[paramIndex++];
        results = results.filter(r => r.date >= startDate);
      }

      if (dateEndMatch && params[paramIndex]) {
        const endDate = params[paramIndex++];
        results = results.filter(r => r.date <= endDate);
      }

      // Sort by date DESC
      results.sort((a, b) => b.date - a.date);

      // Apply LIMIT if present
      if (lowerSql.includes("limit") && params[paramIndex]) {
        const limit = params[paramIndex];
        results = results.slice(0, limit);
      }

      return results as T[];
    } else if (lowerSql.includes("doc_index") && lowerSql.includes("centroid")) {
      // Handle doc_index queries for two-stage retrieval
      let results = this.data.doc_index.map((idx: any) => {
        const doc = this.data.documents.find((d: any) => d.id === idx.documentId);
        return {
          id: idx.documentId,
          centroid: idx.centroid,
          date: doc?.date || 0,
        };
      });

      // Apply filters
      if (lowerSql.includes("documents.type = ?")) {
        const docTypeIndex = params.findIndex((p: any) =>
          typeof p === 'string' && ['text', 'pdf', 'image'].includes(p)
        );
        if (docTypeIndex !== -1) {
          const docType = params[docTypeIndex];
          results = results.filter((r: any) => {
            const doc = this.data.documents.find((d: any) => d.id === r.id);
            return doc?.type === docType;
          });
        }
      }

      if (lowerSql.includes("documents.date >= ?")) {
        const dateIndex = params.findIndex((p: any) => typeof p === 'number');
        if (dateIndex !== -1) {
          const startDate = params[dateIndex];
          results = results.filter((r: any) => r.date >= startDate);
        }
      }

      if (lowerSql.includes("documents.date <= ?")) {
        const dateIndex = params.findIndex((p: any) => typeof p === 'number');
        if (dateIndex !== -1) {
          const endDate = params[dateIndex];
          results = results.filter((r: any) => r.date <= endDate);
        }
      }

      // Sort by date DESC
      results.sort((a: any, b: any) => b.date - a.date);

      return results as T[];
    }

    return [];
  }

  getFirstSync<T = Row>(): T | undefined {
    return undefined;
  }

  // Reset method for testing
  reset() {
    this.data = {
      documents: [],
      chunks: [],
      doc_index: [],
    };
  }
}

export function openDatabaseSync(): MockDatabase {
  if (globalDbInstance) {
    return globalDbInstance;
  }
  return new MockDatabase();
}
