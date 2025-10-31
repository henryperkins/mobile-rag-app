module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo(nent)?|@expo(nent)?|expo-modules|@expo|@sentry/react-native|react-native-reanimated)/)"
  ]
};