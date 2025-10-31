export const cosine = (a: number[], b: number[]) => {
  let dot = 0, ma = 0, mb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    dot += x * y; ma += x * x; mb += y * y;
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
};