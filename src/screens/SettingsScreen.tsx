import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");
  const [hidden, setHidden] = useState(true);

  const [testState, setTestState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [testMsg, setTestMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const k = await SecureStore.getItemAsync("OPENAI_API_KEY");
      if (k) setApiKey(k);
    })();
  }, []);

  async function save() {
    try {
      await SecureStore.setItemAsync("OPENAI_API_KEY", apiKey.trim());
      setSaved("ok");
      setTimeout(() => setSaved("idle"), 1500);
    } catch {
      setSaved("err");
      setTimeout(() => setSaved("idle"), 2000);
    }
  }

  async function testKey() {
    setTestState("loading");
    setTestMsg("");
    const key = apiKey.trim() || (await SecureStore.getItemAsync("OPENAI_API_KEY")) || "";
    if (!key) {
      setTestState("err");
      setTestMsg("No API key set.");
      return;
    }
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` }
      });
      if (!res.ok) {
        const t = await res.text();
        setTestState("err");
        // keep it short; surface status + a little detail
        setTestMsg(`${res.status}: ${t.slice(0, 120)}${t.length > 120 ? "…" : ""}`);
        return;
      }
      setTestState("ok");
      setTestMsg("");
      // let the checkmark bask in glory for a second
      setTimeout(() => setTestState("idle"), 1500);
    } catch (e: any) {
      setTestState("err");
      setTestMsg(e?.message ?? "Network error");
    }
  }

  return (
    <View className="flex-1 bg-[#0b1020]">
      <View className="p-4">
        <Text className="text-white text-2xl font-bold">Settings</Text>
        <Text className="text-gray-300 mt-1">
          Add your OpenAI API key (stored locally with SecureStore). Press "Test Key" for a quick sanity check.
        </Text>
      </View>

      <View className="px-4 pt-2">
        <Text className="text-gray-300 mb-2">OpenAI API Key</Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-... (never hardcode in code)"
            placeholderTextColor="#94a3b8"
            secureTextEntry={hidden}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-white bg-white/10 rounded-xl px-3 py-2"
          />
          <TouchableOpacity
            className="px-3 py-2 rounded-xl bg-white/10"
            onPress={() => setHidden((h) => !h)}
          >
            <Text className="text-white text-xs">{hidden ? "Show" : "Hide"}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity
            onPress={save}
            className="px-4 py-2 rounded-xl bg-accent/30 border border-accent/40"
          >
            <Text className="text-accent font-medium">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={testKey}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15"
          >
            <Text className="text-white font-medium">
              {testState === "loading" ? "Testing…" : "Test Key"}
            </Text>
          </TouchableOpacity>
        </View>

        {saved === "ok" && <Text className="text-green-400 mt-2">Saved ✓</Text>}
        {saved === "err" && <Text className="text-red-400 mt-2">Failed to save. Try again.</Text>}

        {testState === "ok" && <Text className="text-green-400 mt-2">Key works ✓</Text>}
        {testState === "err" && <Text className="text-red-400 mt-2">Test failed: {testMsg}</Text>}

        <Text className="text-gray-400 mt-6 text-xs">
          Pro tip: In production, proxy requests through your backend for rate limits, analytics, and key rotation.
        </Text>
      </View>
    </View>
  );
}