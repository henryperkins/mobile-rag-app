import { View, Text, ScrollView, Pressable, Alert, Share } from "react-native";
import React, { useMemo } from "react";
import { chunksForDocument, getDocumentById } from "../utils/vectorDb";
import { useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import type { RouteProp } from "@react-navigation/native";
import type { DocumentsStackParamList } from "../types/navigation";
import type { ChunkRow } from "../types/document";

export default function DocumentViewer() {
  const route = useRoute<RouteProp<DocumentsStackParamList, "DocumentViewer">>();
  const { id, title } = route.params;
  const chunks = useMemo<ChunkRow[]>(() => chunksForDocument(id), [id]);
  const document = useMemo(() => getDocumentById(id), [id]);

  const fullText = useMemo(() => chunks.map((c) => c.content).join("\n\n"), [chunks]);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(fullText);
      Alert.alert("Success", "Document copied to clipboard");
    } catch {
      Alert.alert("Error", "Failed to copy document");
    }
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const safeName = (document?.title || title || "document").replace(/[^a-z0-9._-]+/gi, "_");
        const fileUri = `${FileSystem.cacheDirectory ?? ""}${safeName}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, fullText, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: document?.title || title
        });
      } else {
        await Share.share({ message: fullText, title: document?.title || title });
      }
    } catch {
      Alert.alert("Error", "Failed to share document");
    }
  };

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-xl font-bold">{title}</Text>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-gray-400 text-sm">
            {document?.type?.toUpperCase() || "UNKNOWN"} • {chunks.length} chunks • {document ? ((document.size/1024).toFixed(1) + " KB") : "Unknown size"}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleCopy}
              className="bg-white/20 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-xs font-medium">Copy</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="bg-cyan-500/20 px-3 py-1 rounded-full"
            >
              <Text className="text-cyan-300 text-xs font-medium">Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <ScrollView className="px-4">
        <Text className="text-gray-200 leading-6">
          {fullText}
        </Text>
      </ScrollView>
    </View>
  );
}
