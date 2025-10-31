import { View, FlatList } from "react-native";
import React from "react";
import { useChatStore } from "../state/chatStore";
import SwipeableMessage from "../components/SwipeableMessage";
import ChatInput from "../components/ChatInput";
import TypingIndicator from "../components/TypingIndicator";
import ErrorBanner from "../components/ErrorBanner";
import { Text, TouchableOpacity } from "react-native";

export default function ChatScreen() {
  const { messages, activeThread, send, typing, newThread, threads, setActive, deleteMessage, error, clearError } = useChatStore();
  const msgs = messages[activeThread] ?? [];

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Chat</Text>
        <View className="flex-row gap-2 mt-2">
          <TouchableOpacity className="bg-white/10 px-3 py-1 rounded" onPress={newThread}>
            <Text className="text-accent">New Thread</Text>
          </TouchableOpacity>
          <FlatList
            horizontal
            data={threads}
            keyExtractor={(i) => i}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setActive(item)} className="bg-white/10 px-3 py-1 rounded">
                <Text className="text-white text-xs" numberOfLines={1}>
                  {item === "default" ? "default" : item.slice(0,8)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />

      <FlatList
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <SwipeableMessage
            msg={item}
            onDelete={() => deleteMessage(item.threadId, item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      {typing && <TypingIndicator />}
      <ChatInput onSend={(t) => send(t)} />
    </View>
  );
}