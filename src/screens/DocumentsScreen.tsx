import { View, Text, TouchableOpacity, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useDocumentStore } from "../state/documentStore";
import DocumentCard from "../components/DocumentCard";
import ErrorBanner from "../components/ErrorBanner";
import SkeletonCard from "../components/SkeletonCard";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { DocumentsStackParamList } from "../types/navigation";

export default function DocumentsScreen() {
  const nav = useNavigation<StackNavigationProp<DocumentsStackParamList, "DocumentsHome">>();
  const { docs, loading, error, refresh, addFromPicker, addImageForOcr, remove, clearError } = useDocumentStore();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  useEffect(() => { refresh(); }, []);

  const handleDeletePress = (docId: string) => {
    setDocToDelete(docId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (docToDelete) {
      await remove(docToDelete);
      setDeleteModalVisible(false);
      setDocToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setDocToDelete(null);
  };

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-2xl font-bold">Documents</Text>
        <Text className="text-gray-300 mt-1">Manage your library. It's like a brain—except it syncs.</Text>
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />

      <View className="flex-row gap-3 px-4">
        <TouchableOpacity className="bg-white/10 p-3 rounded-xl" onPress={addFromPicker}>
          <Text className="text-accent">Upload File</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white/10 p-3 rounded-xl" onPress={addImageForOcr}>
          <Text className="text-accent">OCR Image</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="p-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={docs}
          refreshing={loading}
          onRefresh={refresh}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <DocumentCard
              doc={item}
              onOpen={() => nav.navigate("DocumentViewer", { id: item.id, title: item.title })}
              onDelete={() => handleDeletePress(item.id)}
            />
          )}
        />
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </View>
  );
}
