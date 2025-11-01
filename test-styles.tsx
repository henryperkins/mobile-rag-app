import React from 'react';
import { View, Text, Pressable } from 'react-native';

// Simple test component to verify TailwindCSS + NativeWind works
export default function TestStyles() {
  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-white text-2xl font-bold mb-4">CSS Test</Text>
      <View className="bg-white/10 rounded-xl p-3">
        <Text className="text-white font-semibold">Test Card</Text>
        <Text className="text-gray-300 text-xs mt-1">This should be styled</Text>
        <Pressable className="self-end mt-2 px-2 py-1 rounded bg-red-500/30">
          <Text className="text-red-200 text-xs">Test Button</Text>
        </Pressable>
      </View>
    </View>
  );
}