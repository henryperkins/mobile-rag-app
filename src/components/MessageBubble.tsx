import { View, Text } from "react-native";
import React from "react";
import Markdown from "react-native-markdown-display";
import type { ChatMessage } from "../types/ai";
import { cn } from "../utils/cn";

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  // Markdown styling that matches our dark theme
  const markdownStyles = {
    body: { color: "white", fontSize: 14, lineHeight: 20 },
    code_inline: {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "#06B6D4",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: "monospace"
    },
    code_block: {
      backgroundColor: "rgba(0,0,0,0.3)",
      color: "#e2e8f0",
      padding: 8,
      borderRadius: 6,
      fontFamily: "monospace",
      fontSize: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#06B6D4"
    },
    fence: {
      backgroundColor: "rgba(0,0,0,0.3)",
      color: "#e2e8f0",
      padding: 8,
      borderRadius: 6,
      fontFamily: "monospace",
      fontSize: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#06B6D4"
    },
    blockquote: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderLeftWidth: 3,
      borderLeftColor: "#06B6D4",
      paddingLeft: 12,
      paddingVertical: 8,
      fontStyle: "italic"
    },
    heading1: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
    heading2: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 6 },
    heading3: { color: "white", fontSize: 14, fontWeight: "bold", marginBottom: 4 },
    list_item: { color: "white", marginBottom: 4 },
    link: { color: "#06B6D4", textDecorationLine: "underline" },
    strong: { color: "white", fontWeight: "bold" },
    em: { color: "white", fontStyle: "italic" }
  };

  return (
    <View className={cn("px-4 my-1", isUser ? "items-end" : "items-start")}>
      <View className={cn(
        "max-w-[90%] rounded-2xl px-3 py-2",
        isUser ? "bg-white/10" : "bg-black/30 border border-white/10"
      )}>
        {isUser ? (
          <Text className="text-white">{msg.content}</Text>
        ) : (
          <Markdown
            style={markdownStyles}
            mergeStyle={true}
            rules={{
              link: (node, children, parent, styles) => {
                return (
                  <Text key={node.key} style={styles.link}>
                    {children}
                  </Text>
                );
              }
            }}
          >
            {msg.content}
          </Markdown>
        )}
      </View>
    </View>
  );
}