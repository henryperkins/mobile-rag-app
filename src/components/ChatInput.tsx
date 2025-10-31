import { View, TextInput, TouchableOpacity, Text } from "react-native";
import React, { useState } from "react";

export default function ChatInput({ onSend }: { onSend: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <View className="flex-row items-center gap-2 p-3 bg-black/40">
      <TextInput
        value={v}
        onChangeText={setV}
        placeholder="Ask with your docs…"
        placeholderTextColor="#94a3b8"
        className="flex-1 text-white bg-white/10 rounded-xl px-3 py-2"
      />
      <TouchableOpacity
        className="px-4 py-2 rounded-xl bg-accent/30 border border-accent/40"
        onPress={() => { if (v.trim()) { onSend(v); setV(""); } }}
      >
        <Text className="text-accent font-medium">Send</Text>
      </TouchableOpacity>
    </View>
  );
}