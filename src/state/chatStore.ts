import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage } from "../types/ai";
import { randomUUID } from "../utils/uuid";
import { retrieveTopK } from "../utils/vectorDb";
import { chatWithRag } from "../api/chat-service";
import { reportError } from "../utils/sentry";

type ChatState = {
  threads: string[]; // ids
  messages: Record<string, ChatMessage[]>;
  activeThread: string;
  typing: boolean;
  error?: string;
  newThread: () => void;
  send: (text: string) => Promise<void>;
  setActive: (id: string) => void;
  deleteMessage: (threadId: string, messageId: string) => void;
  clearError: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: ["default"],
      messages: { default: [] },
      activeThread: "default",
      typing: false,
      newThread: () => {
        const id = randomUUID();
        const threads = [id, ...get().threads];
        set({ threads, activeThread: id, messages: { ...get().messages, [id]: [] } });
      },
      setActive: (id: string) => set({ activeThread: id }),
      deleteMessage: (threadId, mid) => {
        const arr = get().messages[threadId] ?? [];
        set({ messages: { ...get().messages, [threadId]: arr.filter(m => m.id !== mid) } });
      },
      clearError: () => set({ error: undefined }),
      send: async (text: string) => {
        const threadId = get().activeThread;
        const userMsg: ChatMessage = { id: randomUUID(), role: "user", content: text, createdAt: Date.now(), threadId };
        set({ messages: { ...get().messages, [threadId]: [...(get().messages[threadId]||[]), userMsg] }, typing: true, error: undefined });

        try {
          const top = await retrieveTopK(text, 3);
          const ctx = top.map((t, i) => `(${(t.score).toFixed(3)}) [${t.documentId}] ${t.content}`);
          const answer = await chatWithRag(text, ctx);
          const aiMsg: ChatMessage = { id: randomUUID(), role: "assistant", content: answer, createdAt: Date.now(), threadId };
          set({ messages: { ...get().messages, [threadId]: [...(get().messages[threadId]||[]), aiMsg] } });
        } catch (e: any) {
          reportError(e, { where: "chat.send" });
          set({ error: e?.message ?? "Chat failed." });
        } finally {
          set({ typing: false });
        }
      }
    }),
    { name: "chatStore", storage: createJSONStorage(() => AsyncStorage) }
  )
);