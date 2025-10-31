import "react-native-gesture-handler";
import "react-native-reanimated";
import "./src/polyfills";
import { initSentry } from "./src/utils/sentry";
import React, { useEffect } from "react";

// Initialize Sentry before app renders
initSentry();
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import ChatScreen from "./src/screens/ChatScreen";
import DocumentsScreen from "./src/screens/DocumentsScreen";
import DocumentViewer from "./src/screens/DocumentViewer";
import SearchScreen from "./src/screens/SearchScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { View } from "react-native";
import { initDb } from "./src/utils/vectorDb";

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

function DocumentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DocumentsHome" component={DocumentsScreen} />
      <Stack.Screen name="DocumentViewer" component={DocumentViewer} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initDb();
  }, []);

  return (
    <NavigationContainer theme={{ dark: true, colors: { background: "#0b1020", primary: "#06B6D4", text: "#fff", card: "#0b1020", border: "#1f2937", notification: "#06B6D4" } as any }}>
      <View className="flex-1 bg-gradient-to-b from-[#581C87] to-[#1E3A8A]">
        <Tabs.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: "#0b1020", borderTopColor: "#1f2937" }, tabBarActiveTintColor: "#06B6D4" }}>
          <Tabs.Screen name="Chat" component={ChatScreen} />
          <Tabs.Screen name="Documents" component={DocumentsStack} />
          <Tabs.Screen name="Search" component={SearchScreen} />
          <Tabs.Screen name="Settings" component={SettingsScreen} />
        </Tabs.Navigator>
      </View>
    </NavigationContainer>
  );
}
