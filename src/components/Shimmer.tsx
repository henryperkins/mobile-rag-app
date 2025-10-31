import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Shimmer({ height = 16, width = "100%", radius = 12 }: {
  height?: number; width?: number | string; radius?: number;
}) {
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: 200, duration: 1200, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -200, duration: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View style={[styles.container, { height, width, borderRadius: radius }]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.06)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  shimmer: { ...StyleSheet.absoluteFillObject }
});