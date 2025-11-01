module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^expo-file-system$": "<rootDir>/__mocks__/expo-file-system.ts",
    "^expo-document-picker$": "<rootDir>/__mocks__/expo-document-picker.ts",
    "^expo-image-picker$": "<rootDir>/__mocks__/expo-image-picker.ts",
    "^expo-constants$": "<rootDir>/__mocks__/expo-constants.ts",
    "^expo-secure-store$": "<rootDir>/__mocks__/expo-secure-store.ts",
    "^expo-sqlite$": "<rootDir>/__mocks__/expo-sqlite.ts",
    "^react-native$": "<rootDir>/__mocks__/react-native.ts",
    "^react-native-gesture-handler$": "<rootDir>/__mocks__/react-native-gesture-handler.ts",
    "^react-native-reanimated$": "<rootDir>/__mocks__/react-native-reanimated.ts",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/expo-vector-icons.ts",
    "^pdfjs-dist/legacy/build/pdf$": "<rootDir>/__mocks__/pdfjs-dist-legacy-build-pdf.ts",
    "^pdfjs-dist/legacy/build/pdf.worker.entry$": "<rootDir>/__mocks__/pdf-worker-entry.ts"
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }]
  },
  };
