import { Text, Pressable } from "react-native";
import React from "react";
import type { DocumentRow } from "../types/document";

export default function DocumentCard({
  doc, onOpen, onDelete
}: { doc: DocumentRow; onOpen: () => void; onDelete: () => void }) {
  return (
    <Pressable onPress={onOpen} className="bg-white/10 rounded-xl p-3">
      <Text className="text-white font-semibold" numberOfLines={1}>{doc.title}</Text>
      <Text className="text-gray-300 text-xs mt-1">
        {doc.type.toUpperCase()} • {doc.chunkCount} chunks • {(doc.size/1024).toFixed(1)} KB
      </Text>
      <Pressable
        onPress={(e) => { e.stopPropagation(); onDelete(); }}
        className="self-end mt-2 px-2 py-1 rounded bg-red-500/30"
      >
        <Text className="text-red-200 text-xs">Delete</Text>
      </Pressable>
    </Pressable>
  );
}