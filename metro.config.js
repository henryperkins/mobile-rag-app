const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

const { resolver } = config;

// Enhanced resolver configuration for CSS and NativeWind
config.resolver = {
  ...resolver,
  sourceExts: [...resolver.sourceExts, 'mjs', 'css'],
  assetExts: [...resolver.assetExts.filter(ext => ext !== 'css'), 'wasm'],
};

module.exports = config;
