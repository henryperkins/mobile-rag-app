import { View, Text } from "react-native";
import React from "react";

export default function TypingIndicator() {
  return (
    <View className="px-4 py-2">
      <Text className="text-gray-300">AI is thinking...</Text>
    </View>
  );
}
