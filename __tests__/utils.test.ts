import { chunkText } from "../src/utils/documentProcessing";
import { cosine } from "../src/utils/cosine";

// Mock the embedText function for testing retrieveTopK
jest.mock("../src/api/embeddings", () => ({
  embedText: jest.fn(),
}));

import { embedText } from "../src/api/embeddings";
import { initDb, insertDocument, insertChunk, retrieveTopK, clearEmbeddingCache } from "../src/utils/vectorDb";

describe("chunkText", () => {
  it("creates overlapping 500-char chunks with 50 overlap", () => {
    const s = "a".repeat(1200); // 1200 chars
    const chunks = chunkText(s, 500, 50);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(500);
    expect(chunks[1].length).toBe(500);
    expect(chunks[2].length).toBe(300);
    // overlap: end of c0 and start of c1 should share 50 chars
    expect(chunks[0].slice(450)).toBe(chunks[1].slice(0, 50));
  });

  it("handles short strings gracefully", () => {
    const chunks = chunkText("hello", 500, 50);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe("hello");
  });
});

describe("cosine", () => {
  it("is 1.0 for identical vectors", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });
  it("is ~0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  it("is symmetric and scale-invariant", () => {
    const a = [2, 4, 6];
    const b = [1, 2, 3];
    expect(cosine(a, b)).toBeCloseTo(1, 5);
    expect(cosine(b, a)).toBeCloseTo(1, 5);
  });
  it("returns 0 when either vector has zero magnitude", () => {
    expect(cosine([0, 0, 0], [0, 0, 0])).toBe(0);
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosine([1, 2, 3], [0, 0, 0])).toBe(0);
  });
  it("handles empty or mismatched length vectors without NaN", () => {
    expect(cosine([], [1, 2, 3])).toBe(0);
    expect(cosine([1, 2], [])).toBe(0);
    expect(cosine([1, 0], [0, 1, 2])).toBeCloseTo(0, 5);
  });
});

describe("retrieveTopK", () => {
  beforeEach(() => {
    // Reset the database before each test
    const db = require("expo-sqlite").openDatabaseSync("rag.db");
    db.reset(); // This should always be available in our mock
    initDb();
    clearEmbeddingCache();
    // Clear any mock implementations
    jest.clearAllMocks();
  });

  it("retrieves and ranks chunks by semantic similarity", async () => {
    // Mock deterministic embeddings for predictable testing
    const mockEmbeddings: { [key: string]: number[] } = {
      "cat": [1, 0, 0],
      "dog": [0, 1, 0],
      "bird": [0, 0, 1],
      "feline": [0.9, 0.1, 0], // similar to cat
      "canine": [0.1, 0.9, 0], // similar to dog
    };

    (embedText as jest.Mock).mockImplementation(async (text: string) => {
      // Return mock embedding based on keyword match, otherwise default
      for (const [keyword, embedding] of Object.entries(mockEmbeddings)) {
        if (text.toLowerCase().includes(keyword)) {
          return embedding;
        }
      }
      return [0.1, 0.1, 0.1]; // default embedding
    });

    // Insert test documents and chunks
    const doc1Id = "doc1";
    const doc2Id = "doc2";

    insertDocument({ id: doc1Id, title: "Animals", size: 100, chunkCount: 2, date: Date.now(), type: "text" });
    insertDocument({ id: doc2Id, title: "More Animals", size: 100, chunkCount: 1, date: Date.now(), type: "text" });

    insertChunk("chunk1", doc1Id, "The cat is a feline mammal", mockEmbeddings["cat"]);
    insertChunk("chunk2", doc1Id, "The dog is a canine pet", mockEmbeddings["dog"]);
    insertChunk("chunk3", doc2Id, "The bird flies in the sky", mockEmbeddings["bird"]);

    // Query for cat - should return cat-related chunks first
    const results = await retrieveTopK("feline", 2);

    expect(results).toHaveLength(2);
    // First result should be the chunk about cats/felines (highest similarity)
    expect(results[0].content).toBe("The cat is a feline mammal");
    expect(results[0].score).toBeGreaterThan(results[1].score);

    // All results should have scores
    results.forEach(result => {
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  it("handles no matching chunks gracefully", async () => {
    (embedText as jest.Mock).mockResolvedValue([1, 0, 0]);

    // Query with no documents in database
    const results = await retrieveTopK("nonexistent", 3);
    expect(results).toHaveLength(0);
  });

  it("respects maxChunks option for performance", async () => {
    (embedText as jest.Mock).mockResolvedValue([1, 0, 0]);

    // Insert multiple documents
    const docId = "perf-test-doc";
    insertDocument({ id: docId, title: "Test Doc", size: 500, chunkCount: 5, date: Date.now(), type: "text" });

    // Insert 5 chunks
    for (let i = 0; i < 5; i++) {
      insertChunk(`chunk-${i}`, docId, `Chunk content ${i}`, [1, 0, 0]);
    }

    // Query with maxChunks limit
    const results = await retrieveTopK("test", 10, { maxChunks: 3 });

    // Should process at most 3 chunks as specified
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
