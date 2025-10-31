import { View, TextInput, Text, FlatList, TouchableOpacity, Switch } from "react-native";
import React, { useState } from "react";
import { retrieveTopK } from "../utils/vectorDb";
import SkeletonCard from "../components/SkeletonCard";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyPdf, setOnlyPdf] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      // Ask for a few extra when filtering, then trim
      const k = onlyPdf ? 30 : 10;
      const r = await retrieveTopK(q, k, onlyPdf ? { docType: "pdf" } : undefined);
      setRes((onlyPdf ? r.slice(0, 10) : r));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-2xl font-bold">Semantic Search</Text>
        <Text className="text-gray-400 mt-1">Ask in natural language. Boom: vectors.</Text>
      </View>

      <View className="px-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Switch value={onlyPdf} onValueChange={setOnlyPdf} />
          <Text className="text-gray-300">Only PDFs</Text>
        </View>
      </View>

      <View className="px-4 mt-2 flex-row gap-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="e.g., What's the Q3 revenue?"
          placeholderTextColor="#94a3b8"
          className="flex-1 text-white bg-white/10 rounded-xl px-3 py-2"
          onSubmitEditing={run}
        />
        <TouchableOpacity onPress={run} className="px-4 py-2 rounded-xl bg-accent/30 border border-accent/40">
          <Text className="text-accent">{loading ? "…" : "Search"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="p-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={res}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View className="bg-white/10 p-3 rounded-xl">
              <Text className="text-gray-300 text-xs mb-1">
                score {(item.score as number).toFixed(3)} • doc {item.documentId}
              </Text>
              <Text className="text-white">{item.content}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}