import { chunkText } from "../src/utils/documentProcessing";
import { cosine } from "../src/utils/cosine";

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
