import { View, Text, TouchableOpacity, Modal } from "react-native";
import React from "react";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="bg-[#1e293b] mx-6 rounded-xl p-6 max-w-sm w-full">
          <Text className="text-white text-xl font-bold mb-3">{title}</Text>
          <Text className="text-gray-300 text-base mb-6">{message}</Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-white/10 py-3 rounded-xl"
              onPress={onCancel}
            >
              <Text className="text-white text-center font-medium">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-red-500/30 border border-red-500/40 py-3 rounded-xl"
              onPress={onConfirm}
            >
              <Text className="text-red-300 text-center font-medium">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}