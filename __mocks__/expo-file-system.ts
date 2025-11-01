export enum EncodingType {
  Base64 = "base64",
  UTF8 = "utf8"
}

export const cacheDirectory = "/tmp/";

export async function readAsStringAsync(): Promise<string> {
  return "";
}

export async function writeAsStringAsync(): Promise<void> {
  // noop
}
