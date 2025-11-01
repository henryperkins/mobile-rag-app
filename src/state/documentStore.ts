import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDb, listDocuments, deleteDocument } from "../utils/vectorDb";
import { ingestDocument, pickAnyDocument, pickImageForOcr } from "../utils/documentProcessing";
import { reportError } from "../utils/sentry";
import type { DocumentRow } from "../types/document";

type DocState = {
  docs: DocumentRow[];
  loading: boolean;
  error?: string;
  refresh: () => void;
  addFromPicker: () => Promise<void>;
  addImageForOcr: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useDocumentStore = create<DocState>()(
  persist(
    (set, get) => ({
      docs: [],
      loading: false,
      error: undefined,
      refresh: () => {
        initDb();
        const docs = listDocuments();
        set({ docs });
      },
      addFromPicker: async () => {
        set({ loading: true, error: undefined });
        try {
          const asset = await pickAnyDocument();
          const mime = asset.mimeType || "";
          const type: "pdf" | "text" = mime.includes("pdf") ? "pdf" : "text";
          await ingestDocument({
            title: asset.name ?? "document",
            type,
            uri: asset.uri,
            size: asset.size ?? 0
          });
          get().refresh();
        } catch (err: unknown) {
          reportError(err, { where: "document.addFromPicker" });
          const message = err instanceof Error ? err.message : "Failed to add document.";
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },
      addImageForOcr: async () => {
        set({ loading: true, error: undefined });
        try {
          const asset = await pickImageForOcr();
          await ingestDocument({
            title: asset.fileName ?? "image",
            type: "image",
            uri: asset.uri,
            size: asset.fileSize ?? 0
          });
          get().refresh();
        } catch (err: unknown) {
          reportError(err, { where: "document.addImageForOcr" });
          const message = err instanceof Error ? err.message : "Failed to process image.";
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },
      remove: async (id: string) => {
        try { deleteDocument(id); get().refresh(); }
        catch (err: unknown) {
          reportError(err, { where: "document.remove" });
          const message = err instanceof Error ? err.message : "Delete failed.";
          set({ error: message });
        }
      },
      clearError: () => set({ error: undefined })
    }),
    { name: "docStore", storage: createJSONStorage(() => AsyncStorage) }
  )
);
