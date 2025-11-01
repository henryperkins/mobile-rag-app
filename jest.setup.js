// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock expo vector icons
jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});