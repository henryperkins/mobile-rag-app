import "react-native-reanimated";           // must be first
import "react-native-gesture-handler";
import "./global.css";                        // import global CSS styles
import "./src/polyfills";
import { initSentry } from "./src/utils/sentry";
import React, { useEffect } from "react";

// Initialize Sentry before app renders
initSentry();
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import ChatScreen from "./src/screens/ChatScreen";
import DocumentsScreen from "./src/screens/DocumentsScreen";
import DocumentViewer from "./src/screens/DocumentViewer";
import SearchScreen from "./src/screens/SearchScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { initDb } from "./src/utils/vectorDb";
import type { DocumentsStackParamList, RootTabParamList } from "./src/types/navigation";

const Stack = createStackNavigator<DocumentsStackParamList>();
const Tabs = createBottomTabNavigator<RootTabParamList>();

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

  const theme: Theme = {
    dark: true,
    colors: {
      primary: "#06B6D4",
      background: "#0b1020",
      card: "#0b1020",
      text: "#fff",
      border: "#1f2937",
      notification: "#06B6D4"
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: 'normal'
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500'
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold'
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900'
      }
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
      <LinearGradient
        colors={["#581C87", "#1E3A8A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <Tabs.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: "#0b1020", borderTopColor: "#1f2937" }, tabBarActiveTintColor: "#06B6D4" }}>
          <Tabs.Screen name="Chat" component={ChatScreen} />
          <Tabs.Screen name="Documents" component={DocumentsStack} />
          <Tabs.Screen name="Search" component={SearchScreen} />
          <Tabs.Screen name="Settings" component={SettingsScreen} />
        </Tabs.Navigator>
      </LinearGradient>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
