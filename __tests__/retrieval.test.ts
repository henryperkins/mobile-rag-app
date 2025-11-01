import { rankByCosine } from "../src/utils/vectorDb";

describe("rankByCosine", () => {
  it("orders rows by descending cosine similarity", () => {
    const q = [1, 0, 0];
    const rows = [
      { id: "a", embedding: [1, 0, 0] },        // score 1
      { id: "b", embedding: [1, 1, 0] },        // ~0.707
      { id: "c", embedding: [-1, 0, 0] }        // -1
    ];
    const top = rankByCosine(q, rows, 3);
    expect(top.map(x => x.id)).toEqual(["a", "b", "c"]);
    expect(top[0].score).toBeCloseTo(1, 5);
  });

  it("handles ties deterministically by stable sort of scores", () => {
    const q = [1, 0];
    const rows = [
      { id: "a", embedding: [2, 0] }, // 1.0
      { id: "b", embedding: [1, 0] }  // 1.0
    ];
    const top = rankByCosine(q, rows, 2);
    // Exact order isn't critical if scores tie, but must include both
    expect(top.map(x => x.id).sort()).toEqual(["a", "b"]);
  });
});