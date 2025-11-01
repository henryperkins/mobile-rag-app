import { View, TextInput, Text, FlatList, TouchableOpacity, Switch } from "react-native";
import React, { useState } from "react";
import { retrieveTopK } from "../utils/vectorDb";
import SkeletonCard from "../components/SkeletonCard";
import type { RankedChunk } from "../utils/vectorDb";
import { StyleSheet } from "react-native";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<RankedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyPdf, setOnlyPdf] = useState(false);

  const styles = StyleSheet.create({
    searchButtonLabel: {
      textDecorationLine: "none",
    },
    searchResultsContent: {
      padding: 16,
      gap: 12,
    },
  });

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

  const handleSearch = () => {
    run();
  };

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-2xl font-bold">Semantic Search</Text>
        <Text className="text-gray-400 mt-1">Ask in natural language. Boom: vectors.</Text>
      </View>

      <View className="px-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Switch value={onlyPdf} onValueChange={setOnlyPdf} />
          <Text className="text-slate-200 text-sm ml-2">
            Only PDFs
          </Text>
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
        <TouchableOpacity
          className="mt-3 flex-row items-center justify-center rounded-lg border border-accent/80 bg-accent px-4 py-2"
          onPress={handleSearch}
        >
          <Text
            className="text-accent font-semibold"
            style={styles.searchButtonLabel}
          >
            Search
          </Text>
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
          contentContainerStyle={styles.searchResultsContent}
          renderItem={({ item }) => (
            <View className="bg-white/10 p-3 rounded-xl">
              <Text className="text-gray-300 text-xs mb-1">
                score {item.score.toFixed(3)} • doc {item.documentId}
              </Text>
              <Text className="text-white">{item.content}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
