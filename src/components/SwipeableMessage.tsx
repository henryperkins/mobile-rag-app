import React, { useRef } from "react";
import { View, Animated, Text, TouchableOpacity } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "../types/ai";

interface SwipeableMessageProps {
  msg: ChatMessage;
  onDelete: () => void;
}

export default function SwipeableMessage({ msg, onDelete }: SwipeableMessageProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 80;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX < -swipeThreshold) {
        // Swipe left enough - trigger delete
        Animated.timing(translateX, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete();
        });
      } else {
        // Snap back to position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={{
          transform: [{ translateX }],
        }}
      >
        <View className="relative">
          {/* Delete background that shows when swiped */}
          <View
            className="absolute inset-0 bg-red-500/20 rounded-2xl justify-end items-center pr-4"
            style={{ zIndex: 0 }}
          >
            <TouchableOpacity onPress={onDelete} className="p-2">
              <Text className="text-red-300 font-medium">Delete</Text>
            </TouchableOpacity>
          </View>

          {/* Message content */}
          <View style={{ zIndex: 1 }}>
            <MessageBubble msg={msg} />
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}
