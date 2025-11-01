export enum EncodingType {
  Base64 = "base64",
  UTF8 = "utf8"
}

export async function readAsStringAsync(
  _uri: string,
  _options?: { encoding?: EncodingType }
): Promise<string> {
  return "";
}
