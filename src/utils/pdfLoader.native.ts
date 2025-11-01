export async function loadPdf() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
  return pdfjs;
}
