// src/polyfills.ts
// Minimal shims so pdfjs-dist works in RN
// @ts-ignore
if (!global.window) (global as any).window = global;
if (!(global as any).navigator) (global as any).navigator = { userAgent: "react-native" };