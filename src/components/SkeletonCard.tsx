import React from "react";
import { View } from "react-native";
import Shimmer from "./Shimmer";

export default function SkeletonCard() {
  return (
    <View className="bg-white/10 rounded-xl p-3">
      <Shimmer height={16} width="70%" />
      <View className="h-2" />
      <Shimmer height={10} width="50%" />
      <View className="h-2" />
      <Shimmer height={10} width="30%" />
    </View>
  );
}