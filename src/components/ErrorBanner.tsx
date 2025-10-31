import { View, Text, TouchableOpacity } from "react-native";
import { cn } from "../utils/cn";

export default function ErrorBanner({ message, onDismiss }: { message?: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <View className={cn("mx-3 mt-2 rounded-lg p-3", "bg-red-500/20 border border-red-500/40")}>
      <View className="flex-row justify-between items-center">
        <Text className="text-red-300 flex-1 pr-3">{message}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text className="text-red-200">Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}