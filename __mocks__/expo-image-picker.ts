export enum MediaTypeOptions {
  Images = "Images"
}

export async function requestMediaLibraryPermissionsAsync(): Promise<{ status: "granted" }> {
  return { status: "granted" };
}

export async function launchImageLibraryAsync(): Promise<any> {
  return { canceled: true, assets: [] };
}
