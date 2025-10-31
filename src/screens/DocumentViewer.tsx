import { View, Text, ScrollView } from "react-native";
import React, { useMemo } from "react";
import { chunksForDocument } from "../utils/vectorDb";
import { useRoute } from "@react-navigation/native";

export default function DocumentViewer() {
  const route = useRoute<any>();
  const { id, title } = route.params;
  const chunks = useMemo(() => chunksForDocument(id), [id]);
  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-xl font-bold">{title}</Text>
        <Text className="text-gray-400 mt-1">Full document (stitched from chunks)</Text>
      </View>
      <ScrollView className="px-4">
        <Text className="text-gray-200 leading-6">
          {chunks.map((c: any) => c.content).join("\n\n")}
        </Text>
      </ScrollView>
    </View>
  );
}