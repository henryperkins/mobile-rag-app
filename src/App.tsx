import "react-native-gesture-handler";
import "./nativewind";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

import ChatScreen from "./screens/ChatScreen";
import DocumentsScreen from "./screens/DocumentsScreen";
import SearchScreen from "./screens/SearchScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const DocumentsStack = createNativeStackNavigator();

type TabRouteName = "Chat" | "Documents" | "Search" | "Settings";

const iconMap: Record<TabRouteName, keyof typeof Feather.glyphMap> = {
    Chat: "message-circle",
    Documents: "folder",
    Search: "search",
    Settings: "settings",
};

function DocumentsNavigator() {
    return (
        <DocumentsStack.Navigator screenOptions={{ headerShown: false }}>
            <DocumentsStack.Screen name="DocumentsHome" component={DocumentsScreen} />
        </DocumentsStack.Navigator>
    );
}

export default function App() {
    const scheme = useColorScheme();
    const theme = scheme === "dark" ? DarkTheme : DefaultTheme;

    return (
        <NavigationContainer theme={theme}>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: scheme === "dark" ? "#94a3b8" : "#475569",
                    tabBarStyle: {
                        backgroundColor: theme.colors.card,
                        borderTopColor: "transparent",
                    },
                    tabBarIcon: ({ color, size }) => {
                        const name = iconMap[route.name as TabRouteName];
                        return <Feather name={name} size={size ?? 22} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Chat" component={ChatScreen} />
                <Tab.Screen name="Documents" component={DocumentsNavigator} />
                <Tab.Screen name="Search" component={SearchScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
