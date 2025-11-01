// src/polyfills.ts
// Minimal shims so pdfjs-dist works in RN
// @ts-ignore
declare global {
   
  var window: typeof globalThis;
   
  var navigator: { userAgent: string };
}

const globalObject = globalThis as typeof globalThis & {
  window?: typeof globalThis;
  navigator?: { userAgent: string };
};

if (!globalObject.window) globalObject.window = globalObject;
if (!globalObject.navigator) globalObject.navigator = { userAgent: "react-native" };

export {};
