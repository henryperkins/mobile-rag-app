export const cosine = (a: number[], b: number[]) => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    dot += x * y; ma += x * x; mb += y * y;
  }
  if (ma === 0 || mb === 0) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
};
