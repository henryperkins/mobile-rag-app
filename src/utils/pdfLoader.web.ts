export async function loadPdf(): Promise<never> {
  throw new Error("PDF processing is not supported on web platform");
}
